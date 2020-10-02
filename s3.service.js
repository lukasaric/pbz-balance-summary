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
    const params = { Bucket: config.bucket, MaxKeys: 4, Prefix: 'reports/' };
    const { Contents } = await this.s3.listObjectsV2(params).promise();
    const objects = await Promise.all(Contents.map(({ Key }) => this.getFile(Key)));
    return Contents.map((it, index) => ({
      date: it.LastModified, key: it.Key, content: objects[index].Body
    })).slice(1, 4);
  }
}

module.exports = new Storage();
