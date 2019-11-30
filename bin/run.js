#!/usr/bin/env node

const fs = require('fs');

const consoleStyles = require('../lib/consoleStyles.js')
const index = require('../index.js')

let flags = process.argv.filter(e => /^-/.test(e));
let args = process.argv.splice(2).filter(e => !/^-/.test(e));
const subcommand = args[0];
args.splice(0, 1);

switch (subcommand) {
  case "compile":
    index.compile(args, {fullError: flags.some(e => e === "-fullErr"), generateJSON: flags.some(e => e === "-generateJSON"), noErrors: flags.some(e => e === "-noErrors"), noOutput: flags.some(e => e === "-noOutput"), noWhitelines: flags.some(e => e === "-noWhitelines"), noCredits: flags.some(e => e === "-noCredits"), respectJsonPath: flags.some(e => e === "-respectJsonPath")});
    break;

  case "watch":
    index.watch(args, {fullError: flags.some(e => e === "-fullErr"), generateJSON: flags.some(e => e === "-generateJSON"), noErrors: !flags.some(e => e === "-err" || e === "-fullErr"), noInitial: flags.some(e => e === "-noInitial"), noOutput: flags.some(e => e === "-noOutput"), noWhitelines: flags.some(e => e === "-noWhitelines"), noCredits: flags.some(e => e === "-noCredits"), respectJsonPath: flags.some(e => e === "-respectJsonPath")});
    break;

  case "create":
    index.create(args, {fullError: flags.some(e => e === "-fullErr")});
    break;

  default:
    console.log(consoleStyles.FgRed + 'Please select a sub command' + consoleStyles.Reset);
    break;
}
