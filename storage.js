'use strict';

const { amazonStorage: config } = require('./config');
const S3 = require('aws-sdk/clients/s3');

const API_VERSION = '2012-10-17';

const s3 = new S3({
  signatureVersion: 'v4',
  accessKeyId: config.key,
  secretAccessKey: config.secret,
  region: config.region,
  apiVersion: API_VERSION
});

module.exports.getFile = ({ messageId }) => {
  const params = {
    Bucket: config.bucket,
    Key: `reports/${messageId}`
  };
  return s3.getObject(params).promise();
};
