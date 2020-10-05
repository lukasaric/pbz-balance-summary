'use strict';

const { isAllowedSource, isEmpty } = require('./utils');
const { ses, storage } = require('./amazon');
const AccBalanceResolver = require('./accBalanceResolver');
const AttachmentsResolver = require('./attachmentsResolver');

module.exports.resolveAccBalance = async event => {
  const mail = event.Records[0].ses.mail;
  if (!isAllowedSource(mail)) return;
  const opts = { files: await storage.listFiles(), incomingKey: mail.messageId };
  const attachments = await new AttachmentsResolver(opts).getAttachments();
  if (isEmpty(attachments)) return;
  return new AccBalanceResolver(attachments).inferBalance()
    .then(summary => ses.forwardReport(summary))
    .catch(err => ses.forwardError(err));
};
