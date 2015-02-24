#!/usr/bin/env node
'use strict';
var Promise = require('es6-promise');
var pkg = require('../package');
var name = Object.keys(pkg.bin)[0];

var argv = require('yargs')
  .usage('Modify a project\'s version number.\nUsage: ' + name + ' <options> [ <newversion> | major | minor | patch | prerelease | prepatch | preminor | premajor ]')
  .string('_')
  .array('file')
  .alias('file', 'f')
  .default('file', ['package.json'])
  .describe('file', 'Filename. This can be specified multiple times.')
  .requiresArg('file')
  .boolean('nogit')
  .alias('nogit', 'n')
  .describe('nogit', 'Don\'t create a commit and tag in git.')
  .strict()
  .version(pkg.version, 'version', 'Show the version number of ' + name + '.')
  .help('help', 'Show this help information.')
  .alias('help', ['h', '?'])
  .argv;

console.log(argv); throw 'banana';
require('./')(argv._.join(' '), argv.nogit, argv.file)
.then(
  version => console.log(version),
  err => console.error(err.message)
);
