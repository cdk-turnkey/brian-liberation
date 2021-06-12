#!/bin/bash

deploy-to-bucket() {
  BUCKET=$1
  if [[ ! -n "${BUCKET}" ]]
  then
    echo "error, deploy-to-bucket: bad bucket name ${BUCKET}"
    exit 1
  fi
  if ! aws s3 ls "s3://${BUCKET}" &> /dev/null
  then
    echo "error, deploy-to-bucket: unable to ls on s3://${BUCKET}"
    exit 1
  fi
  cd scripts/deploy-to-non-cf-bucket
  aws s3 sync \
    --content-type "text/html" \
    --exclude "*" \
    --include "*.html" \
    --delete \
    --acl "public-read" \
    ./ s3://${BUCKET}/
}
