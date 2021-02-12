const chalk = require('chalk');
const { db } = require('../modules/db');
const { Position } = require('../models/Position');
const { env } = require('../modules/env');

const { getPortfolio } = require('../modules/tinkoffInvest');
const { getQuoteModules, searchForPosition } = require('../modules/yahooFinance');

const getPositionModel = async (query) => {
  const positionInfo = (await searchForPosition(query));

  if (!positionInfo) {
    return null;
  }

  const ticker = positionInfo?.symbol ?? '';

  const data = await getQuoteModules(ticker, ['assetProfile', 'financialData', 'defaultKeyStatistics']);

  return {
    ticker,
    ...positionInfo,
    ...data,
  }
}

const paramsConfig = {
  'Ticker': (m) => m.ticker,
  'Sector': (m) => m.assetProfile?.sector ?? '-',
  'Audit Risk': (m) => m.assetProfile?.auditRisk ?? '-',
  'Overall Risk': (m) => m.assetProfile?.overallRisk ?? '-',
  'Currency': (m) => m.financialData?.financialCurrency ?? '-',
  'Current Price': (m) => m.financialData?.currentPrice?.fmt ?? '-',
  'Target High Price': (m) => {
    const price = m.financialData?.currentPrice?.raw ?? 0;
    const targetPrice = m.financialData?.targetHighPrice?.raw ?? 0;
    const percent = ((targetPrice - price) / price) * 100;

    return (m.financialData?.targetHighPrice?.fmt ?? '-') + ` (${percent.toFixed(2)}%)`;
  },
  'Target Low Price': (m) => {
    const price = m.financialData?.currentPrice?.raw ?? 0;
    const targetPrice = m.financialData?.targetLowPrice?.raw ?? 0;
    const percent = ((targetPrice - price) / price) * 100;

    return (m.financialData?.targetLowPrice?.fmt ?? '-') + ` (${percent.toFixed(2)}%)`;
  },
  'Quick Ratio': (m) => m.financialData?.quickRatio?.fmt ?? '-',
  'P/E': (m) => {
    const price = m.financialData?.currentPrice?.raw ?? 0;
    const eps = m.defaultKeyStatistics?.trailingEps?.raw ?? 0;

    return (price / eps).toFixed(2);
  },
  'Recommendation': (m) => {
    return m.financialData?.recommendationKey ?? '-'
  },
}

module.exports = async (args) => {
  const pairs = args.slice(1);
  const argsParsed = {};
  
  pairs.forEach(pair => {
    const [attr, value] = pair.split('=');

    argsParsed[attr] = value;
  });

  const {tickers = ''} = argsParsed;

  const tickersList = tickers.split(',');
  const paramsList = ['currentPrice', 'targetHighPrice', 'targetLowPrice', 'recommendationKey'];

  const assets = [];

  for (let i = 0; i < tickersList.length; i++) {
    const ticker = tickersList[i];
    
    assets.push(await getPositionModel(ticker));
  }

  const table = [];

  Object.keys(paramsConfig).forEach((key, i) => {
    const getter = paramsConfig[key];
    
    table[i] = [key, ...assets.map(getter)];
  })

  const columnMaxSizes = Array(assets.length + 1).fill(0);

  table.forEach((row) => {
    row.forEach((col, colIndex) => {
      columnMaxSizes[colIndex] = Math.max(columnMaxSizes[colIndex], `${col}`.length + 2);
    })
  })

  table.forEach((row) => {
    let rowString = '';

    rowString = row.map((col, i) => {
      return ` ${col}`.padEnd(columnMaxSizes[i], ' ');
    }).join(chalk.magentaBright('|'));

    console.log(chalk.magentaBright(`|`) + rowString + chalk.magentaBright('|'));
  })

}