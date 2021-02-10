const { db } = require('../modules/db');

let isInit = false;

class Position {
  constructor(data) {
    Object.assign(this, data);
  }

  static initTable() {
    if (isInit) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      db.run(`CREATE TABLE IF NOT EXISTS positions (
        tcsTicker TEXT PRIMARY KEY,
        ticker TEXT NOT NULL,
        isin TEXT NOT NULL,
        shortname TEXT NOT NULL,
        longname TEXT NOT NULL,
        country TEXT NOT NULL,
        industry TEXT NOT NULL,
        sector TEXT NOT NULL,
        exchange TEXT NOT NULL,
        quoteType TEXT NOT NULL,
        "index" TEXT NOT NULL,
        fullTimeEmployees INTEGER NOT NULL,
        overallRisk INTEGER NOT NULL,
        auditRisk INTEGER NOT NULL,
        boardRisk INTEGER NOT NULL,
        compensationRisk INTEGER NOT NULL,
        shareHolderRightsRisk INTEGER NOT NULL
      )`, () => {
        isInit = true;
        resolve();
      });
    });
  }

  static async getByTicker(ticker) {
    await Position.initTable();

    return new Promise((resolve) => {
      db.all(`SELECT * FROM "positions" WHERE tcsTicker=$ticker`, { $ticker: ticker }, async function (res, rows) {
        if (res === null) {
          const row = rows === null ? null : rows[0];

          if (row) {
            resolve(new Position(row));
          } else {
            resolve(null);
          }
        } else {
          throw Error(res);
        }
      });
    })
  }

  static async create(tcsTicker, isin, positionInfo, assetProfile) {
    await Position.initTable();

    return new Promise((resolve) => {
      const insertObj = {
        $tcsTicker: tcsTicker ?? '',
        $ticker: positionInfo?.symbol || tcsTicker || '',
        $isin: isin ?? '',
        $shortname: positionInfo?.shortname ?? '',
        $longname: positionInfo?.longname ?? '',
        $country: assetProfile?.country ?? 'Unknown',
        $industry: assetProfile?.industry ?? 'Unknown',
        $sector: assetProfile?.sector ?? 'Unknown',
        $exchange: positionInfo?.exchange ?? 'Unknown',
        $quoteType: positionInfo?.quoteType ?? 'Unknown',
        $index: positionInfo?.index ?? 'Unknown',
        $fullTimeEmployees: assetProfile?.fullTimeEmployees ?? 0,
        $overallRisk: assetProfile?.overallRisk ?? 0,
        $auditRisk: assetProfile?.auditRisk ?? 0,
        $boardRisk: assetProfile?.boardRisk ?? 0,
        $compensationRisk: assetProfile?.compensationRisk ?? 0,
        $shareHolderRightsRisk: assetProfile?.shareHolderRightsRisk ?? 0
      }

      const query = `INSERT INTO 
          "positions" (${Object.keys(insertObj).map(v => `"${v.substr(1)}"`).join(', ')})
          VALUES (${Object.keys(insertObj).map(v => `${v}`).join(', ')});  
        `;

      db.run(query, insertObj, function (res) {
        if (res !== null) {
          throw new Error(res);
        } else {
          Position.getByTicker(tcsTicker).then(resolve);
        }
      });
    });
  }
}

module.exports = { Position };