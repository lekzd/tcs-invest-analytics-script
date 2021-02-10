#!/usr/bin/env node

const args = process.argv.slice(2);
const act = args[0] ?? 'portfolio';

async function run() {
  const runAct = require(`./acts/${act}`);

  runAct(args);
};

run();
