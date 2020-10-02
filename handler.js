'use strict';

const {
  getObjectByDate, isAllowedSource, processAttachments, processSameFormatFiles
} = require('./utils');
const AccBalanceResolver = require('./accBalanceResolver');
const ses = require('./ses.service');
const storage = require('./s3.service');

module.exports.resolveAccBalance = async event => {
  const mail = event.Records[0].ses.mail;
  if (!isAllowedSource(mail)) return;
  let files = await storage.listFiles();
  if (files.length < 2) return;
  if (files.length > 2) files = await processSameFormatFiles(files);
  const attachments = files.flatMap(it => it.email.attachments);
  const reports = processAttachments(attachments);
  if (Object.keys(reports).length < 2) {
    const oldest = getObjectByDate(files, 'min').key;
    return storage.removeFile(oldest);
  }
  return new AccBalanceResolver(reports).inferBalance()
    .then(summary => ses.forwardReport(summary))
    .catch(err => ses.forwardError(err));
};
