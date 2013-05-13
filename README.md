npm-maintainers
===============

A utility to fetch and collate a list of npm package maintainers for a particular country or region. Uses data collected daily at <https://github.com/polyhack/npm-github-data>. Collected by [npm-github-data-collector](https://github.com/polyhack/npm-github-data-collector).

Currently there is only a list of Australian users, this is determined by a large regex matching against the GitHub account *location* field. See the See **[npm-maintainers-au](https://github.com/polyhack/npm-maintainers-au)** package for a wrapper that provides the Australian list.

**If you wish to have your own country included in the list, perhaps you want to set up a site like <http://nodejs.org.au>, file an issue on [npm-github-data-collector](https://github.com/polyhack/npm-github-data-collector) and we'll get it done!**

## Usage

After downloading two large JSON data files from the above repository, you end up with an array of user entries that combines npm and GitHub data, something like this:

```js
var npmMaintainers = require('npm-maintainers')

var options = {
    // country code
    country          : 'au'
    // a list of npm and/or GitHub usernames to ignore, because the country
    // regex is a bit too broad perhaps
  , ignoreUsers      : [ 'foobar' ]
    // a mapping of npm -> GitHub usernames, only needed for accounts that
    // can't be automatically worked out, see stdout for details
  , npmGithubMapping : { 'boom': 'bang' }
}

npmMaintainers(function (err, data) {
/*
`data` is an array containing an element per npm maintainer, like:
[
    ...
  , {
        githubLogin: 'rvagg'
      , npmLogin: 'rvagg'
      , user_lc: 'rvagg'
      , name: 'Rod Vagg'
      , location: 'South Coast NSW, Australia'
      , blog: 'http://rod.vagg.org'
      , avatar: 'https://secure.gravatar.com/avatar/026f5af604a336a38301639027757f29?d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png'
      , email: 'rod@vagg.org'
      , company: 'X\'Prime Pty Ltd'
      , hireable: true
      , githubUrl: 'https://github.com/rvagg'
      , packages: [ ... a list of their npm packages ... ]
      , fetched: Mon May 13 2013 14:51:00 GMT+1000 (EST)
    }
  , ...
]
*/
})
```

For a long running process, like a website, run this at least every 24 hours to pick up new data from the data repository.

## Licence

npm-maintainers is Copyright (c) 2012 Rod Vagg [@rvagg](https://twitter.com/rvagg) and the #polyhack team and licenced under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.