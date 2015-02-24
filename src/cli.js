#!/usr/bin/env node
'use strict';
var Promise = require('es6-promise');

var argv = require('yargs')
  .usage('Usage: $0 [ <newversion> | major | minor | patch | prerelease | prepatch | preminor | premajor ] <options>')
  .boolean('no-git')
  .describe('no-git', 'Don\'t commit or create a tag.')
  .string('file')
  .alias('file', 'f')
  .default('file', 'manifest.json')
  .describe('file', 'Filename.')
  .requiresArg('file')
  .string('_')
  .strict()
  .version(() => require('../package').version)
  .argv;

require('./')(argv._.join(' '), argv.noGit, argv.filename)
.then(
  version => console.log(version),
  err => console.error(err)
);