'use strict';

const { isAllowedSource, isEmpty } = require('./utils');
const AccBalanceResolver = require('./accBalanceResolver');
const AttachmentsResolver = require('./attachmentsResolver');
const ses = require('./ses.service');
const storage = require('./s3.service');

module.exports.resolveAccBalance = async event => {
  const mail = event.Records[0].ses.mail;
  if (!isAllowedSource(mail)) return;
  const files = await storage.listFiles();
  const attachments = await new AttachmentsResolver(files).getAttachments();
  if (isEmpty(attachments)) return;
  return new AccBalanceResolver(attachments).inferBalance()
    .then(summary => ses.forwardReport(summary))
    .catch(err => ses.forwardError(err));
};
