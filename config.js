'use strict';

const path = require('path');

module.exports = {
  s3: {
    key: process.env.STORAGE_KEY,
    secret: process.env.STORAGE_SECRET,
    region: process.env.REGION,
    bucket: process.env.STORAGE_BUCKET,
    prefix: path.join(process.env.STORAGE_PREFIX, '/')
  },
  ses: {
    sender: {
      name: process.env.EMAIL_SENDER_NAME,
      address: process.env.EMAIL_SENDER_ADDRESS
    },
    region: process.env.REGION,
    recipientAddress: process.env.EMAIL_RECIPIENT_ADDRESS,
    allowedSources: [
      process.env.MAIN_ALLOWED_SOURCE,
      process.env.TEST_ALLOWED_SOURCE
    ]
  }
};
