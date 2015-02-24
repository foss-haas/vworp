'use strict';
var Promise = require('es6-promise').Promise;
var detectJsonIndent = require('detect-json-indent');
var semver = require('semver');
var git = require('gift')('.');
var fs = require('fs');

module.exports = bump;

function bump(version, noGit, filenames) {
  if (!filenames) filenames = 'manifest.json';
  filenames = Array.isArray(filenames) ? filenames : [filenames];
  if (!version) return readFile(filenames[0]).then(parseJson).then(manifest => 'v' + (manifest.version || '0.0.0'));
  if (noGit) return bumpManifest(false);
  return checkGitStatus().then(bumpManifest);

  function bumpManifest(useGit) {
    return readFile(filenames[0]).then(parseJson).then(manifest => {
      return bumpVersion(manifest.version, version).then(version => {
        if (manifest.version === version) return Promise.resolve(version);
        manifest.version = version;
        var p = Promise.all(filenames.map(
          filename => updateManifestVersion(filename, version)
        ));
        if (useGit) p = p.then(() => commitAndTagFiles(filenames, version));
        return p.then(() => 'v' + version);
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

function updateManifestVersion(filename, version) {
  console.log('bumping', filename, 'to', version);
  return readFile(filename).then(inData => {
    var indent = detectJsonIndent(inData);
    return parseJson(inData).then(manifest => {
      manifest.version = version;
      var outData = JSON.stringify(manifest, null, indent);
      return writeFile(filename, outData);
    });
  });
}

function readFile(filename) {
  return new Promise((resolve, reject) =>
    fs.readFile(filename, 'utf-8', (err, data) => err ? reject(err) :
      resolve(data)
    )
  );
}

function writeFile(filename, data) {
  return new Promise((resolve, reject) =>
    fs.writeFile(filename, data, err => err ? reject(err) :
      resolve(data)
    )
  );
}

function parseJson(data) {
  return Promise.resolve(data).then(data => JSON.parse(data));
}

function commitAndTagFiles(filenames, version) {
  return new Promise((resolve, reject) =>
    git.add(filenames, err => err ? reject(err) :
      git.commit(version, err => err ? reject(err) :
        git.create_tag('v' + version, err => err ? reject(err) :
          resolve()
        )
      )
    )
  );
}
