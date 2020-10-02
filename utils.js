'use strict';

const { format, unformat } = require('currency-formatter');
const { ses } = require('./config');
const storage = require('./s3.service');

const normalizeAmount = amount => unformat(amount, { locale: 'hr_HR' });

const formatAmount = amount => `${format(amount, { currency: 'HRK' })} HRK`;

const isBuffer = arg => Buffer.isBuffer(arg);

const isAllowedSource = ({ source }) => ses.allowedSources.some(it => it === source);

function processAttachments(attachments) {
  return attachments.reduce((acc, { content, filename }) => {
    const ext = filename.includes('.xml') ? 'xml' : 'rtf';
    acc[ext] = content;
    return acc;
  }, {});
}

function getObjectByDate(items, action) {
  const date = new Date(Math[action](...items.map(it => new Date(it.date))));
  return items.find(it => it.date.toISOString() === date.toISOString());
}

async function processSameFormatFiles(files) {
  const adjustedFiles = files.map(it => ({
    ...it, attachments: processAttachments(it.email.attachments)
  }));
  const latest = getObjectByDate(adjustedFiles, 'max').attachments;
  const sameFormatItems = adjustedFiles.filter(it => it.attachments[Object.keys(latest)[0]]);
  const oldest = getObjectByDate(sameFormatItems, 'min').key;
  await storage.removeFile(oldest);
  return adjustedFiles.filter(it => it.key !== oldest);
}

module.exports = {
  normalizeAmount,
  formatAmount,
  isBuffer,
  isAllowedSource,
  processAttachments,
  getObjectByDate,
  processSameFormatFiles
};
