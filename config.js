'use strict';

module.exports = {
  s3: {
    key: process.env.STORAGE_KEY,
    secret: process.env.STORAGE_SECRET,
    region: process.env.REGION,
    bucket: process.env.STORAGE_BUCKET,
    prefix: process.env.STORAGE_PREFIX
  },
  ses: {
    sender: {
      name: process.env.EMAIL_SENDER_NAME,
      address: process.env.EMAIL_SENDER_ADDRESS
    },
    region: process.env.REGION,
    recipientAddress: process.env.EMAIL_RECIPIENT_ADDRESS,
    allowedSources: [
      process.env.ALLOWED_SOURCE,
      'lsaric@extensionengine.com',
      'iroglic@extensionengine.com'
    ]
  }
};
