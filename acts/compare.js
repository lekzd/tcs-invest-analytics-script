const chalk = require('chalk');
const stringLength = require('string-length');

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

const redGreen = (value, border = 0) => {
  if (value == null) {
    return '-';
  }
  return parseFloat(value, 10) > border ? chalk.green(value) : chalk.red(value);
}

const greenRed = (value, border = 0) => {
  if (value == null) {
    return '-';
  }
  return parseFloat(value, 10) < border ? chalk.green(value) : chalk.red(value);
}

const paramsConfig = {
  'Ticker': (m) => chalk.bold(m.ticker),
  'Sector': (m) => m.assetProfile?.sector ?? '-',
  'Audit Risk': (m) => greenRed(m.assetProfile?.auditRisk, 5),
  'Overall Risk': (m) => greenRed(m.assetProfile?.overallRisk, 5),
  'Currency': (m) => m.financialData?.financialCurrency ?? '-',
  'Current Price': (m) => m.financialData?.currentPrice?.fmt ?? '-',
  'Target High Price': (m) => {
    const price = m.financialData?.currentPrice?.raw ?? 0;
    const targetPrice = m.financialData?.targetHighPrice?.raw ?? 0;
    const percent = ((targetPrice - price) / price) * 100;

    return (m.financialData?.targetHighPrice?.fmt ?? '-') + ` (${redGreen(`${percent.toFixed(2)}%`)})`;
  },
  'Target Low Price': (m) => {
    const price = m.financialData?.currentPrice?.raw ?? 0;
    const targetPrice = m.financialData?.targetLowPrice?.raw ?? 0;
    const percent = ((targetPrice - price) / price) * 100;

    return (m.financialData?.targetLowPrice?.fmt ?? '-') + ` (${redGreen(`${percent.toFixed(2)}%`)})`;
  },
  'Quick Ratio': (m) => redGreen(m.financialData?.quickRatio?.fmt, 1),
  'Beta Ratio': (m) => greenRed(m.defaultKeyStatistics?.beta?.fmt, 1),
  'P/E': (m) => {
    const price = m.financialData?.currentPrice?.raw ?? 0;
    const eps = m.defaultKeyStatistics?.trailingEps?.raw ?? 0;

    return (price / eps).toFixed(2);
  },
  'Recommendation': (m) => {
    switch (m.financialData?.recommendationKey) {
      case 'buy':
        return chalk.green('buy');
      case 'sell':
        return 'sell';
      case 'hold':
        return chalk.yellow('hold');
      default:
        return '-';
    }
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
      columnMaxSizes[colIndex] = Math.max(columnMaxSizes[colIndex], stringLength(`${col}`) + 2);
    })
  })

  table.forEach((row) => {
    let rowString = '';

    rowString = row.map((col, i) => {
      const template = ` ${col}`;
      const diff = template.length - stringLength(template);
      return template.padEnd(columnMaxSizes[i] + diff, ' ');
    }).join(chalk.magentaBright('|'));

    console.log(chalk.magentaBright(`|`) + rowString + chalk.magentaBright('|'));
  })

}