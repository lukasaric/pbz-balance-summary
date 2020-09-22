'use strict';

const config = require('./config');
const S3 = require('aws-sdk/clients/s3');

const API_VERSION = '2006-03-01';

const s3 = new S3({
  signatureVersion: 'v4',
  accessKeyId: config.key,
  secretAccessKey: config.secret,
  region: config.region,
  apiVersion: API_VERSION
});

exports.handler = function (event, context, callback) {
  console.log('Process email');

  const sesNotification = event.Records[0].ses;
  console.log('SES Notification:\n', JSON.stringify(sesNotification, null, 2));

  // Retrieve the email from your bucket
  s3.getObject({
    Bucket: config.bucket,
    Key: sesNotification.mail.messageId
  }, function (err, data) {
    if (err) {
      console.log(err, err.stack);
      callback(err);
    } else {
      console.log('Raw email:\n' + data.Body);

      // Custom email processing goes here

      callback(null, null);
    }
  });
};
