'use strict';

const { adjustAttachments, isAllowedSource } = require('./utils');
const AccBalanceResolver = require('./accBalanceResolver');
const ses = require('./ses.service');
const { simpleParser } = require('mailparser');
const storage = require('./s3.service');

module.exports.resolveAccBalance = async event => {
  const mail = event.Records[0].ses.mail;
  if (!isAllowedSource(mail)) return;
  const encodedContents = await storage.listFiles();
  if (!encodedContents) return;
  const emails = await Promise.all(encodedContents.map(it => simpleParser(it.Body)));
  const attachments = emails.flatMap(it => it.attachments);
  const reports = adjustAttachments(attachments);
  return new AccBalanceResolver(reports).inferBalance()
    .then(async summary => {
      await ses.forwardReport(summary);
      return Promise.all(storage.keys.map(key => storage.removeFile(key)));
    })
    .catch(err => ses.forwardError(err));
};
