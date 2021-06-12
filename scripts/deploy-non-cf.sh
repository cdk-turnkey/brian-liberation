#!/bin/bash

set -e
# deploy to the non-CloudFront bucket
# get the bucket name from SSM param store
PARAM_NAME=$(npx @cdk-turnkey/stackname --suffix NonCFBucketName)
BUCKET=$(aws ssm get-parameter --name ${PARAM_NAME} | jq '.Parameter.Value' | tr -d '"')
# I think the above could be CloudFormation outputs

echo "PARAM_NAME:"
echo "${PARAM_NAME}"
echo "BUCKET:"
echo "${BUCKET}"

source scripts/deploy-to-non-cf-bucket.sh
deploy-to-bucket ${BUCKET}