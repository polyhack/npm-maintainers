const GITHUB_USERS_DATA_URL     = 'https://raw.github.com/polyhack/npm-github-data/master/githubusers_{cc}.json'
    , ALL_NPM_PACKAGES_DATA_URL = 'https://raw.github.com/polyhack/npm-github-data/master/allpackages.json'

const request          = require('request')
    , after            = require('after')

// download the latest data from github
function fetchData (url, callback) {
  function handle (err, response, body) {
    if (err)
      return callback(err)
    return callback(null, body)
  }

  request({ url: url, json: true, method: 'get'}, handle)
}

// filter and process into a more useful form, stripped down
// to just the users from the country we care about
function processData (options, data, callback) {
  var countryUsers  = []
    , aliases  = {}
    , npmUsers = {}

  // collect aliases to map github user accounts to npm maintainer accounts
  // but this is a rough science since maintainership can be switched around in npm
  data.npmPackagesData.forEach(function (n) {
    if (!n.githubUser)
      return

    var ghuser = n.githubUser.toLowerCase()

    if (!aliases[ghuser])
      aliases[ghuser] = {}

    n.maintainers.forEach(function (maintainer) {
      var m = maintainer.toLowerCase()

      npmUsers[m] = maintainer

      if (options.ignoreUsers && options.ignoreUsers.indexOf(m) == -1)
        aliases[ghuser][m] = (aliases[ghuser][m] || 0) + 1
    })
  })

  // now we do a reverse map against the npm data and find all the packages that
  // have a user in this country as a maintainer (or their alias)
  data.countryGithubData.forEach(function (user) {
    var login        = user.login.toLowerCase()
      , userAliases  = aliases[login] || {}
      , aliasesArray = Object.keys(userAliases)
      , npmPackages
      , npmLogin

    if (options.ignoreUsers && options.ignoreUsers.indexOf(login) > -1)
      return

    if (countryUsers.some(function (u) { return login == u.user_lc }))
      return // dupe, how?

    npmLogin = aliasesArray.length == 1
      ? aliasesArray[0]
      : aliases[login][login]
        ? login
        : false

    if (!npmLogin)
      return console.log('Can\'t work out', login, 'from', aliases[login])

    // all packages for which this user is a maintainer
    npmPackages = data.npmPackagesData.filter(function (n) {
      return n.maintainers.some(function (m) {
        return m.toLowerCase() == npmLogin // npmLogin is still lower case here
      })
    })

    // no packages? no cake!
    if (!npmPackages.length)
      return

    // weird, shouldn't happen but just in case
    if (!npmUsers[npmLogin])
      console.log('Huh? Can\'t find', npmLogin)

    // final data for the view
    countryUsers.push({
        githubLogin : user.login         // correct case
      , npmLogin    : npmUsers[npmLogin] // correct case
      , user_lc     : login
      , name        : user.name
      , location    : user.location
      , blog        : user.blog ? (/http/i).test(user.blog) ? user.blog : 'http://' + user.blog : ''
      , avatar      : user.avatar_url
      , email       : user.email
      , company     : user.company
      , hireable    : user.hireable
      , githubUrl   : user.html_url
      , packages    : npmPackages
      , fetched     : new Date()
    })

  })

  // find any duplicate npmLogin entries, they'll have different githubLogins
  // so we take a best guess and then an educated guess with npmGithubMappings.
  // the main effect here is to remove company entries that resolve to user
  // entries that already exist, such as siphon-io -> deoxxa
  countryUsers = countryUsers.filter(function (a1, i) {
    for (var j = 0, a2; j < countryUsers.length; j++) {
      a2 = countryUsers[j]
      if (i != j && a1.npmLogin == a2.npmLogin) {
        if (a1.npmLogin == a1.githubLogin
            || (options.npmGithubMapping && options.npmGithubMapping[a1.npmLogin] == a1.githubLogin)) {
          // npmLogin is the same as GitHub, or we have a nexplicit override
          break
        } else {
          console.log(
              'Rejecting duplicate npm login: (npm)'
            , a1.npmLogin
            , '(github)'
            , a1.githubLogin
          )
          return false
        }
      }
    }
    return true
  })

  // sort by number of packages, got a better idea?
  countryUsers.sort(function (u1, u2) {
    return u2.packages.length - u1.packages.length
  })

  callback(null, countryUsers)
}

function fetch (options, callback) {
  var result = {}
    , done = after(2, function (err) {
        if (err) return callback(err)
        processData(options, result, callback)
      })

  fetchData(
      GITHUB_USERS_DATA_URL.replace('{cc}', options.country)
    , function (err, data) {
        if (err) return done(err)
        result.countryGithubData = data
        done()
      }
  )

  fetchData(ALL_NPM_PACKAGES_DATA_URL, function (err, data) {
    if (err) return done(err)
    result.npmPackagesData = data
    done()
  })
}

module.exports = fetch