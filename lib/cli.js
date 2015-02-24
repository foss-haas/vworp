#!/usr/bin/env node
"use strict";

var pkg = require("../package");
var name = Object.keys(pkg.bin)[0];

var argv = require("yargs").usage("Modify a project's version number.\nUsage: " + name + " <options> [ <newversion> | major | minor | patch | prerelease | prepatch | preminor | premajor ]").string("_").array("file").alias("file", "f")["default"]("file", ["package.json"]).describe("file", "Filename. This can be specified multiple times.").requiresArg("file").boolean("nogit").alias("nogit", "n").describe("nogit", "Don't create a commit and tag in git.").strict().version(pkg.version, "version", "Show the version number of " + name + ".").help("help", "Show this help information.").alias("help", ["h", "?"]).argv;

require("./")(argv._.join(" "), argv.nogit, argv.file).then(function (version) {
  return console.log(version);
}, function (err) {
  return console.error(err.message);
});