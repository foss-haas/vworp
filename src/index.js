'use strict';
var semver = require('semver');
var git = require('gift')('.');

module.exports = function bump(version, noGit, filename) {
  if (!filename) filename = 'manifest.json';
  if (!version) return readManifest(filename).then(manifest => manifest.version || '0.0.0');
  if (noGit) return bumpManifest(false);
  return checkGitStatus().then(bumpManifest);

  function bumpManifest(useGit) {
    return readManifest(filename).then(manifest =>
      bumpVersion(manifest.version, version).then(version => {
        manifest.version = version;
        var p = writeManifestToFile(filename, manifest);
        if (useGit) p = p.then(() => commitAndTagFile(filename, version))
        return p.then(() => version);
      })
    );
  }
}

function checkGitStatus() {
  return new Promise((resolve, reject) =>
    git.status((err, result) => {
      if (err.code === 128) resolve(false);
      else if (err) reject(err);
      else if (result.clean) resolve(true);
      else reject(new Error('Aborted. Git workspace has uncommitted changes.'));
    })
  );
}

function readManifest(filename) {
  return new Promise((resolve, reject) =>
    fs.readFile(filename, 'utf-8', (err, data) =>
      err ? reject(err) : resolve(data)
    )
  ).then(data => JSON.parse(data));
}

function bumpVersion(version, bump) {
  return Promise.resolve(
    bump.match(/^((pre)?(major|minor|patch)|prerelease)$/)
    ? semver.inc(version || '0.0.0', bump)
    : semver.parse(bump)
  ).then(new Promise((resolve, reject) => version
    ? resolve(version)
    : reject(new Error('Not a valid semver version: ' + bump))
  ));
}

function writeManifestToFile(filename, manifest) {
  return new Promise((resolve, reject) =>
    fs.writeFile(filename, manifest, err => err ? reject(err) :
      resolve(manifest)
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
