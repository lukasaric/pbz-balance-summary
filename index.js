'use strict';

const { extract, parse, verify } = require('@extensionengine/pbzcomnet-signedfile');
const BigNumber = require('bignumber.js');
const parseRTF = require('@extensionengine/rtf-parser');
const { readFileSync } = require('fs');
const request = require('simple-get');
const { unformat } = require('currency-formatter');

BigNumber.set({ DECIMAL_PLACES: 2 });

const normalizeAmount = amount => unformat(amount, { locale: 'de-DE' });

const FILE_PATHS = {
  rtf: process.env.RTF_REPORT,
  xml: process.env.XML_REPORT
};

const ATTRS_DICTIONARY = {
  currencyStatement: 'valuta_izvod',
  newAccBalance: 'novo_stanje',
  middleExchange: 'srednji_tecaj'
};

const EXCHANGE_RATE_URL = 'http://api.hnb.hr/tecajn/v2?valuta=EUR&valuta=USD';

function getExchangeRate() {
  const opts = { url: EXCHANGE_RATE_URL, json: true };
  return new Promise((resolve, reject) => {
    return request.concat(opts, (err, _res, data) => {
      if (err) reject(err);
      const { middleExchange } = ATTRS_DICTIONARY;
      const exchangeRate = data.find(it => it.valuta === 'USD')[middleExchange];
      resolve(normalizeAmount(exchangeRate));
    });
  });
}

function sgnFileResolver(format) {
  const xml = readFileSync(FILE_PATHS[format], 'utf-8');
  const xmlDoc = parse(xml);
  return verify(xmlDoc) ? xmlDoc : null;
}

async function getForeignCurrencyAccBalance() {
  const xmlDoc = sgnFileResolver('xml');
  if (!xmlDoc) return;
  const { currencyStatement, newAccBalance } = ATTRS_DICTIONARY;
  const buffer = await extract(xmlDoc);
  const innerXmlDoc = parse(buffer.toString());
  const arr = innerXmlDoc.findall('*/').find(it => it.tag === currencyStatement);
  const balance = arr.findall('*/').find(it => it.tag === newAccBalance).text;
  const exchangeRate = await getExchangeRate();
  return BigNumber(normalizeAmount(balance)).times(exchangeRate).toNumber();
}

async function getHRKAccBalance() {
  const xmlDoc = sgnFileResolver('rtf');
  if (!xmlDoc) return;
  const buffer = await extract(xmlDoc);
  const rtfDoc = await parseRTF(buffer);
  return getLatestHrkBalance(rtfDoc);
}

function getLatestHrkBalance(rtfDoc) {
  const rftObj = rtfDoc.content.find(paragraph => {
    return paragraph.content.find(span => span.value.includes('Novo stanje:'));
  });
  const span = rftObj.content[0].value;
  return normalizeAmount(span.split(':').pop());
}

async function inferBalance() {
  const hrkAccBalance = await getHRKAccBalance();
  const foreignCurrencyAccBalance = await getForeignCurrencyAccBalance();
  if (!hrkAccBalance || !foreignCurrencyAccBalance) return;
  return BigNumber(hrkAccBalance).plus(foreignCurrencyAccBalance).toNumber();
}

inferBalance().then(amount => console.log(amount));

module.exports = inferBalance;
