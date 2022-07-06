'use strict';

const { isAllowedSource, isEmpty } = require('./utils');
const { ses, storage } = require('./amazon');
const AccountBalanceService = require('./account-balance.service');
const AttachmentService = require('./attachment.service');

module.exports.resolveAccountBalance = async event => {
  const mail = event.Records[0].ses.mail;
  if (!isAllowedSource(mail)) return;
  const opts = { files: await storage.listFiles(), incomingKey: mail.messageId };
  const attachments = await new AttachmentService(opts).getAttachments();
  if (isEmpty(attachments)) return;
  return new AccountBalanceService(attachments).inferBalance()
    .then(ses.forwardReport)
    .catch(ses.forwardError);
};
