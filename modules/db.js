const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbFilePath = path.join(process.cwd(), 'positions.db');
const db = new sqlite3.Database(dbFilePath);

module.exports = { db };