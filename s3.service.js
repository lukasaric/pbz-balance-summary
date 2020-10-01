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
    this.key = null;
    this.keys = [];
  }

  get params() {
    return { Bucket: config.bucket, Key: this.key };
  }

  getFile(key) {
    this.key = key;
    return this.s3.getObject(this.params).promise();
  }

  removeFile(key) {
    this.key = key;
    return this.s3.deleteObject(this.params).promise();
  }

  async listFiles() {
    const params = { Bucket: config.bucket, MaxKeys: 3, Prefix: 'reports/' };
    const { Contents } = await this.s3.listObjectsV2(params).promise();
    this.keys = Contents.map(it => it.Key).slice(1, 3);
    if (this.keys.length < 2) return;
    return Promise.all(this.keys.map(key => this.getFile(key)));
  }
}

module.exports = new Storage();
