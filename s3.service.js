'use strict';

const { s3: config } = require('./config');
const S3 = require('aws-sdk/clients/s3');

const API_VERSION = '2012-10-17';
class Storage {
  constructor() {
    this.s3 = new S3({
      signatureVersion: 'v4',
      accessKeyId: config.key,
      secretAccessKey: config.secret,
      region: config.region,
      apiVersion: API_VERSION
    });
    this.messageId = null;
  }

  get params() {
    return { Bucket: config.bucket, Key: `reports/${this.messageId}` };
  }

  getFile({ messageId }) {
    this.messageId = messageId;
    return this.s3.getObject(this.params).promise();
  }

  removeFile({ messageId }) {
    this.messageId = messageId;
    return this.s3.deleteObject(this.params).promise();
  }
}

module.exports = new Storage();
