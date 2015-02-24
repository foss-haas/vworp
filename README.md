# Synopsis

**vworp** is a tool for bumping the version number of projects and automagically creating git commits and tags for each version.

Basically, it's a substitute for `npm version` that supports updating multiple files and can be used in projects that don't have a `package.json`.

# CLI

```sh
$ vworp --help

Modify a project's version number.
Usage: fworp <options> [ <newversion> | major | minor | patch | prerelease | prepatch | preminor | premajor ]

Options:
  --file, -f      Filename. This can be specified multiple times.
                                                       [default: "package.json"]
  --nogit, -n     Don't create a commit and tag in git.                         
  --version       Show the version number of fworp.                      
  --help, -h, -?  Show this help information. 
```

# API

```js
var vworp = require('vworp');
vworp('1.3.0', false, ['package.json', 'bower.json', 'component.json'])
.then(
  version => console.log('New version:', version),
  err => console.error('Error:', err.message)
);
```

## vworp([newversion[, noGit[, filename]]])

Bumps/sets the version number of the file in `filename` (default: `"package.json"`) to `newversion`.

If `noGit` is not set to `true`, modifying the version number will fail if the current git workspace is not empty and a new commit tagged with the version number (e.g. `v1.0.0`) will be created on success. If not in a git workspace, the option will have no effect.

If `newversion` is not set, the version number will not be modified and the promise will resolve to the current version number of the file or `"0.0.0"` if the file does not contain a `version` property. Otherwise the promise will resolve to the new version number.

If any errors occur, the promise will be rejected with that error.

# License

The MIT/Expat license. For more information, see http://foss-haas.mit-license.org/ or the accompanying [LICENSE](https://github.com/foss-haas/vworp/blob/master/LICENSE) file.