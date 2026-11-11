#!/bin/zsh
# Deploy (or update) the image-variants Lambda and its S3 trigger.
# Requires the AWS CLI configured for the account that owns the bucket.
set -euo pipefail
cd "$(dirname "$0")"

REGION=us-east-1
BUCKET=nicolashubert-graphiste-production
PREFIX=cms/
FN=nh-image-variants
ROLE=nh-image-variants-role
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

# 1. Package: handler + Linux x64 build of sharp (the AWS SDK ships with the runtime).
rm -rf build function.zip && mkdir build
cp index.mjs variants.mjs build/
(cd build && npm init -y >/dev/null && npm pkg set type=module >/dev/null \
  && npm install --omit=dev --no-audit --no-fund --os=linux --cpu=x64 --libc=glibc sharp@^0.34.0 >/dev/null)
(cd build && zip -qr ../function.zip .)
echo "package: $(du -h function.zip | cut -f1)"

# 2. Role: logs + read/write only under the CMS upload prefix.
if ! aws iam get-role --role-name $ROLE >/dev/null 2>&1; then
  aws iam create-role --role-name $ROLE --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{"Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}]
  }' >/dev/null
  aws iam attach-role-policy --role-name $ROLE \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
  echo "role created"
fi
aws iam put-role-policy --role-name $ROLE --policy-name s3-cms-variants --policy-document "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Effect\": \"Allow\",
    \"Action\": [\"s3:GetObject\", \"s3:PutObject\", \"s3:PutObjectAcl\"],
    \"Resource\": \"arn:aws:s3:::$BUCKET/$PREFIX*\"
  }]
}"
ROLE_ARN=$(aws iam get-role --role-name $ROLE --query Role.Arn --output text)

# 3. Function (create, or update code).
if aws lambda get-function --function-name $FN --region $REGION >/dev/null 2>&1; then
  aws lambda update-function-code --function-name $FN --region $REGION --zip-file fileb://function.zip >/dev/null
  echo "function code updated"
else
  sleep 10 # a brand-new role takes a moment to become assumable
  aws lambda create-function --function-name $FN --region $REGION \
    --runtime nodejs22.x --architectures x86_64 --handler index.handler \
    --role "$ROLE_ARN" --zip-file fileb://function.zip \
    --memory-size 1536 --timeout 60 \
    --description "Writes medium/large/xlarge variants for CMS uploads" >/dev/null
  echo "function created"
fi
aws lambda wait function-active-v2 --function-name $FN --region $REGION
FN_ARN=$(aws lambda get-function --function-name $FN --region $REGION --query Configuration.FunctionArn --output text)

# 4. Allow S3 to invoke it, and trigger on uploads under the CMS prefix.
aws lambda add-permission --function-name $FN --region $REGION \
  --statement-id s3-invoke --action lambda:InvokeFunction --principal s3.amazonaws.com \
  --source-arn arn:aws:s3:::$BUCKET --source-account $ACCOUNT >/dev/null 2>&1 || true
aws s3api put-bucket-notification-configuration --bucket $BUCKET --notification-configuration "{
  \"LambdaFunctionConfigurations\": [{
    \"Id\": \"cms-image-variants\",
    \"LambdaFunctionArn\": \"$FN_ARN\",
    \"Events\": [\"s3:ObjectCreated:*\"],
    \"Filter\": {\"Key\": {\"FilterRules\": [{\"Name\": \"prefix\", \"Value\": \"$PREFIX\"}]}}
  }]
}"
echo "trigger: s3://$BUCKET/$PREFIX* -> $FN"
