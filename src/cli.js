#!/usr/bin/env node
'use strict';
var Promise = require('es6-promise');

var argv = require('yargs')
  .usage('Usage: $0 [ <newversion> | major | minor | patch | prerelease | prepatch | preminor | premajor ] <options>')
  .boolean('git')
  .default('git', true)
  .describe('git', 'Create a commit and tag in git. This is the default behaviour and can be disabled with the --no-git option.')
  .string('file')
  .alias('file', 'f')
  .default('file', 'manifest.json')
  .describe('file', 'Filename.')
  .requiresArg('file')
  .string('_')
  .strict()
  .version(() => require('../package').version)
  .argv;

require('./')(argv._.join(' '), !argv.git, argv.filename)
.then(
  version => console.log(version),
  err => console.error(err.message)
);