#!/bin/zsh
# Deploy (or update) the CMS login helper: Lambda nh-cms-auth + public Function URL.
#   GITHUB_CLIENT_ID=<id> infra/cms-auth/deploy.sh
# The OAuth client secret is NOT passed here: it lives in the SSM SecureString
# parameter below, which you create yourself (see README.md).
set -euo pipefail
cd "$(dirname "$0")"

REGION=us-east-1
FN=nh-cms-auth
ROLE=nh-cms-auth
IAM_PATH=/projects/nicolas-hubert/
SECRET_PARAM=/projects/nicolas-hubert/cms-auth/github-client-secret
# Hostnames the CMS may sign in from. Sveltia sends "cms.netlify.com" as its site
# ID when it runs on localhost; the token itself is only ever posted to a window
# whose (browser-verified) origin matches this list, so that entry is harmless.
ALLOWED_DOMAINS="nicolashubert-graphiste.com,www.nicolashubert-graphiste.com,nicolas-hubert-graphiste.github.io,localhost,cms.netlify.com"
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

# 1. Package (the AWS SDK ships with the Node.js runtime; no dependencies).
rm -f function.zip && zip -q function.zip index.mjs worker.mjs && echo "package: $(du -h function.zip | cut -f1)"

# 2. Role: logs + read that one parameter.
if ! aws iam get-role --role-name $ROLE >/dev/null 2>&1; then
  aws iam create-role --role-name $ROLE --path $IAM_PATH \
    --tags Key=project,Value=nicolas-hubert Key=purpose,Value=cms-auth \
      "Key=used-by,Value=Lambda nh-cms-auth" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{"Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}]
    }' >/dev/null
  aws iam attach-role-policy --role-name $ROLE \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
  echo "role created"
fi
aws iam put-role-policy --role-name $ROLE --policy-name read-client-secret --policy-document "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Effect\": \"Allow\",
    \"Action\": \"ssm:GetParameter\",
    \"Resource\": \"arn:aws:ssm:$REGION:$ACCOUNT:parameter$SECRET_PARAM\"
  }]
}"
ROLE_ARN=$(aws iam get-role --role-name $ROLE --query Role.Arn --output text)

ENV="Variables={GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID:-},ALLOWED_DOMAINS=\"$ALLOWED_DOMAINS\",GITHUB_CLIENT_SECRET_PARAM=$SECRET_PARAM}"

# 3. Function.
if aws lambda get-function --function-name $FN --region $REGION >/dev/null 2>&1; then
  aws lambda update-function-code --function-name $FN --region $REGION --zip-file fileb://function.zip >/dev/null
  aws lambda wait function-updated-v2 --function-name $FN --region $REGION
  aws lambda update-function-configuration --function-name $FN --region $REGION \
    --role "$ROLE_ARN" --environment "$ENV" >/dev/null
  echo "function updated"
else
  sleep 10 # a brand-new role takes a moment to become assumable
  aws lambda create-function --function-name $FN --region $REGION \
    --runtime nodejs22.x --architectures arm64 --handler index.handler \
    --role "$ROLE_ARN" --zip-file fileb://function.zip \
    --memory-size 256 --timeout 10 --environment "$ENV" \
    --description "GitHub OAuth helper for Sveltia CMS (sveltia-cms-auth)" \
    --tags project=nicolas-hubert,purpose=cms-auth >/dev/null
  echo "function created"
fi
aws lambda wait function-updated-v2 --function-name $FN --region $REGION

# 4. Public HTTPS URL (the CMS opens it in a popup; no AWS auth on purpose).
if ! aws lambda get-function-url-config --function-name $FN --region $REGION >/dev/null 2>&1; then
  aws lambda create-function-url-config --function-name $FN --region $REGION --auth-type NONE >/dev/null
fi
aws lambda add-permission --function-name $FN --region $REGION --statement-id public-url \
  --action lambda:InvokeFunctionUrl --principal '*' --function-url-auth-type NONE >/dev/null 2>&1 || true
aws lambda add-permission --function-name $FN --region $REGION --statement-id public-url-invoke \
  --action lambda:InvokeFunction --principal '*' --invoked-via-function-url >/dev/null 2>&1 || true
echo "url: $(aws lambda get-function-url-config --function-name $FN --region $REGION --query FunctionUrl --output text)"
