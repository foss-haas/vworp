'use strict';
var Promise = require('es6-promise').Promise;
var detectJsonIndent = require('detect-json-indent');
var semver = require('semver');
var git = require('gift')('.');
var fs = require('fs');

module.exports = bump;

function bump(version, noGit, filename) {
  if (!filename) filename = 'manifest.json';
  if (!version) return readFile(filename).then(data => JSON.parse(data).version || '0.0.0');
  if (noGit) return bumpManifest(false);
  return checkGitStatus().then(bumpManifest);

  function bumpManifest(useGit) {
    return readFile(filename).then(data => {
      var indent = detectJsonIndent(data);
      var manifest = JSON.parse(data);
      return bumpVersion(manifest.version, version).then(version => {
        if (manifest.version === version) return Promise.resolve(version);
        manifest.version = version;
        var p = writeDataToFile(filename, JSON.stringify(manifest, null, indent));
        if (useGit) p = p.then(() => commitAndTagFile(filename, version));
        return p.then(() => version);
      });
    });
  }
}

function checkGitStatus() {
  return new Promise((resolve, reject) =>
    git.status((err, result) => {
      if (err) {
        if (err.code === 128) resolve(false);
        else reject(err);
      }
      else if (result.clean) resolve(true);
      else reject(new Error('Aborted. Git workspace has uncommitted changes.'));
    })
  );
}

function readFile(filename) {
  return new Promise((resolve, reject) =>
    fs.readFile(filename, 'utf-8', (err, data) =>
      err ? reject(err) : resolve(data)
    )
  );
}

function bumpVersion(version, bump) {
  return Promise.resolve(
    bump.match(/^((pre)?(major|minor|patch)|prerelease)$/)
    ? semver.parse(semver.inc(version || '0.0.0', bump))
    : semver.parse(bump)
  ).then(ver => new Promise((resolve, reject) => ver
    ? resolve(ver.version)
    : reject(new Error('Not a valid semver version: ' + bump))
  ));
}

function writeDataToFile(filename, data) {
  return new Promise((resolve, reject) =>
    fs.writeFile(filename, data, err => err ? reject(err) :
      resolve(data)
    )
  );
}

function commitAndTagFile(filename, version) {
  return new Promise((resolve, reject) =>
    git.add(filename, err => err ? reject(err) :
      git.commit(version, err => err ? reject(err) :
        git.create_tag('v' + version, err => err ? reject(err) :
          resolve()
        )
      )
    )
  );
}
