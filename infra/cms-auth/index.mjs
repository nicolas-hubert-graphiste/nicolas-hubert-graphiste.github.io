/**
 * AWS Lambda adapter for the official sveltia-cms-auth worker (worker.mjs,
 * copied unchanged from https://github.com/sveltia/sveltia-cms-auth, MIT).
 *
 * The worker speaks the web Request/Response API. This handler turns a Lambda
 * Function URL event into a Request, runs the worker, and turns its Response
 * back into the Function URL response format. To update the worker, replace
 * worker.mjs with the new src/index.js and redeploy.
 *
 * Settings (Lambda environment): GITHUB_CLIENT_ID, ALLOWED_DOMAINS,
 * GITHUB_CLIENT_SECRET_PARAM (name of an SSM SecureString parameter that holds
 * the OAuth app's client secret, so the secret never sits in config or code).
 */
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import worker from "./worker.mjs";

const ssm = new SSMClient({});
let secretPromise;

/** Load the client secret once per container (cold start), not per request. */
function clientSecret() {
  const name = process.env.GITHUB_CLIENT_SECRET_PARAM;
  if (!name) return Promise.resolve(undefined);
  secretPromise ??= ssm
    .send(new GetParameterCommand({ Name: name, WithDecryption: true }))
    .then((result) => result.Parameter?.Value)
    .catch((error) => {
      secretPromise = undefined; // retry on the next request
      console.error("Could not read the client secret parameter:", error.name);
      return undefined;
    });
  return secretPromise;
}

export async function handler(event) {
  const http = event.requestContext.http;
  const query = event.rawQueryString ? `?${event.rawQueryString}` : "";
  const url = `https://${event.requestContext.domainName}${event.rawPath}${query}`;

  const headers = new Headers(event.headers ?? {});
  // Function URLs move cookies out of the headers into their own array.
  if (event.cookies?.length) headers.set("cookie", event.cookies.join("; "));

  const request = new Request(url, { method: http.method, headers });
  const env = {
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: await clientSecret(),
    ALLOWED_DOMAINS: process.env.ALLOWED_DOMAINS,
  };

  const response = await worker.fetch(request, env);

  const outHeaders = {};
  response.headers.forEach((value, key) => {
    if (key !== "set-cookie") outHeaders[key] = value;
  });
  return {
    statusCode: response.status,
    headers: outHeaders,
    cookies: response.headers.getSetCookie(),
    body: await response.text(),
  };
}
