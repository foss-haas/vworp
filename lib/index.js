"use strict";

var Promise = require("es6-promise").Promise;
var detectJsonIndent = require("detect-json-indent");
var semver = require("semver");
var git = require("gift")(".");
var fs = require("fs");

module.exports = bump;

function bump(version, noGit, filenames) {
  if (!filenames) filenames = "manifest.json";
  filenames = Array.isArray(filenames) ? filenames : [filenames];
  if (!version) {
    return readFile(filenames[0]).then(parseJson).then(function (manifest) {
      return manifest.version || "0.0.0";
    });
  }if (noGit) {
    return bumpManifest(false);
  }return checkGitStatus().then(bumpManifest);

  function bumpManifest(useGit) {
    return readFile(filenames[0]).then(parseJson).then(function (manifest) {
      return bumpVersion(manifest.version, version).then(function (version) {
        if (manifest.version === version) return Promise.resolve(version);
        manifest.version = version;
        var p = Promise.all(filenames.map(function (filename) {
          return updateManifestVersion(filename, version);
        }));
        if (useGit) p = p.then(function () {
          return commitAndTagFiles(filenames, version);
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
      if (err) {
        if (err.code === 128) resolve(false);else reject(err);
      } else if (result.clean) resolve(true);else reject(new Error("Aborted. Git workspace has uncommitted changes."));
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

function updateManifestVersion(filename, version) {
  console.log("bumping", filename, "to", version);
  return readFile(filename).then(function (inData) {
    var indent = detectJsonIndent(inData);
    return parseJson(inData).then(function (manifest) {
      manifest.version = version;
      var outData = JSON.stringify(manifest, null, indent);
      return writeFile(filename, outData);
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

function writeFile(filename, data) {
  return new Promise(function (resolve, reject) {
    return fs.writeFile(filename, data, function (err) {
      return err ? reject(err) : resolve(data);
    });
  });
}

function parseJson(data) {
  return Promise.resolve(data).then(function (data) {
    return JSON.parse(data);
  });
}

function commitAndTagFiles(filenames, version) {
  return new Promise(function (resolve, reject) {
    return git.add(filenames, function (err) {
      return err ? reject(err) : git.commit(version, function (err) {
        return err ? reject(err) : git.create_tag("v" + version, function (err) {
          return err ? reject(err) : resolve();
        });
      });
    });
  });
}