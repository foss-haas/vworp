"use strict";

var Promise = require("es6-promise").Promise;
var detectJsonIndent = require("detect-json-indent");
var semver = require("semver");
var git = require("gift")(".");
var fs = require("fs");

module.exports = bump;

function bump(version, noGit, filename) {
  if (!filename) filename = "manifest.json";
  if (!version) {
    return readFile(filename).then(function (data) {
      return JSON.parse(data).version || "0.0.0";
    });
  }if (noGit) {
    return bumpManifest(false);
  }return checkGitStatus().then(bumpManifest);

  function bumpManifest(useGit) {
    return readFile(filename).then(function (data) {
      var indent = detectJsonIndent(data);
      var manifest = JSON.parse(data);
      return bumpVersion(manifest.version, version).then(function (version) {
        manifest.version = version;
        var p = writeDataToFile(filename, JSON.stringify(manifest, null, indent));
        if (useGit) p = p.then(function () {
          return commitAndTagFile(filename, version);
        });
        return p.then(function () {
          return version;
        });
      });
    });
  }
}

function checkGitStatus() {
  return new Promise(function (resolve, reject) {
    return git.status(function (err, result) {
      if (err.code === 128) resolve(false);else if (err) reject(err);else if (result.clean) resolve(true);else reject(new Error("Aborted. Git workspace has uncommitted changes."));
    });
  });
}

function readFile(filename) {
  return new Promise(function (resolve, reject) {
    return fs.readFile(filename, "utf-8", function (err, data) {
      return err ? reject(err) : resolve(data);
    });
  });
}

function bumpVersion(version, bump) {
  return Promise.resolve(bump.match(/^((pre)?(major|minor|patch)|prerelease)$/) ? semver.parse(semver.inc(version || "0.0.0", bump)) : semver.parse(bump)).then(function (ver) {
    return new Promise(function (resolve, reject) {
      return ver ? resolve(ver.version) : reject(new Error("Not a valid semver version: " + bump));
    });
  });
}

function writeDataToFile(filename, data) {
  return new Promise(function (resolve, reject) {
    return fs.writeFile(filename, data, function (err) {
      return err ? reject(err) : resolve(data);
    });
  });
}

function commitAndTagFile(filename, version) {
  return new Promise(function (resolve, reject) {
    return git.add(filename, function (err) {
      return err ? reject(err) : git.commit(version, function (err) {
        return err ? reject(err) : git.create_tag("v" + version, function (err) {
          return err ? reject(err) : resolve();
        });
      });
    });
  });
}