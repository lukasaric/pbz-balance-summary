'use strict';

module.exports = {
  email: {
    sender: {
      name: process.env.EMAIL_SENDER_NAME,
      address: process.env.EMAIL_SENDER_ADDRESS
    },
    recipientAddress: process.env.EMAIL_RECIPIENT_ADDRESS,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || null,
    ssl: Boolean(process.env.EMAIL_SSL),
    tls: Boolean(process.env.EMAIL_TLS)
  },
  amazonStorage: {
    key: process.env.STORAGE_KEY,
    secret: process.env.STORAGE_SECRET,
    region: process.env.STORAGE_REGION,
    bucket: process.env.STORAGE_BUCKET
  }
};
