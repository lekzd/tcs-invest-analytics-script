const chalk = require('chalk');
const { db } = require('../modules/db');

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

module.exports = async (args) => {
  const pairs = args.slice(1);
  const argsParsed = {};

  pairs.forEach(pair => {
    const [attr, value] = pair.split('=');

    argsParsed[attr] = value;
  });

  const { query = '' } = argsParsed;

  db.serialize(async function () {

    const positionModel = await getPositionModel(query);

    if (positionModel) {
      console.log(positionModel);
    } else {
      console.log(chalk.red(`By query '${query}' not forund`));
    }

    db.close();
  });

}