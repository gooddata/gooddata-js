[![npm version](https://badge.fury.io/js/%40gooddata%2Fgooddata-js.svg)](https://www.npmjs.com/package/@gooddata/gooddata-js)
# GoodData JS SDK
> Thin javascript abstraction over the GoodData REST API

## Getting started
* For rich visualizations, please use the **GoodData.UI**:
    - [GoodData.UI Documentation](http://sdk.gooddata.com/gooddata-ui/)
    - [GoodData.UI React components](https://github.com/gooddata/gooddata-react-components) repository
    - the [Execute component](https://sdk.gooddata.com/gooddata-ui/docs/execute_component.html) for custom visualizations
* gooddata-js serves for specific background tasks, but it could be used for small applications both in the browser and in the node.js environment.

## Usage
### Using as a npm package
1) go to your project directory and add the package: \
      → with [yarn](https://yarnpkg.com): `yarn add @gooddata/gooddata-js` \
      → with [npm](npmjs.com): `npm install --save @gooddata/gooddata-js`

    :heavy_exclamation_mark: **WARNING: npm package renamed from `gooddata` to `@gooddata/gooddata-js`** :heavy_exclamation_mark:

2) import the package's default export: \
    → in transpiled browser app with ES6 modules syntax: `import { factory } from '@gooddata/gooddata-js';` \
    → in node.js with CommonJS syntax: `const factory = require('@gooddata/gooddata-js').factory;`

4) call the API:
    ```js
    var gooddata = factory({ domain: 'secure.gooddata.com' });
    gooddata.user.login('john.doe@example.com', 'your-secret-password')
        .then((response) => console.log('Login OK', response))
        .catch((apiError) => console.error('Login failed', apiError, "\n\n", apiError.responseBody));

    ```

5) Please note that CORS could prevent the request. Refer to [your options in GoodData.UI documentation](https://sdk.gooddata.com/gooddata-ui/docs/cors.html), ie. setup local proxy or ask the GoodData platform for allowing a specific domain.




### Using as a standalone library
You have two options:
  - [download `gooddata.js` or `gooddata.min.js`](https://unpkg.com/@gooddata/gooddata-js@latest/dist/) from the latest release
  - build on your own:
    ```bash
    git clone https://github.com/gooddata/gooddata-js.git
    cd gooddata-js
    git checkout v6.0.0 # choose a version, or omit this line to use unstable code from `master` branch
    yarn install --pure-lockfile
    yarn build
    # get gooddata.js and gooddata.min.js from /dist folder
    ```

Then you can import the library file and global variable `gooddata` contains all exported members:
```html
<script type="text/javascript" src="gooddata.js"></script>
<script type="text/javascript">
    var sdk = gooddata.factory({ domain: 'secure.gooddata.com' });
    sdk.user.login('john.doe@example.com', 'your-secret-password')
</script>
```

## Contributing :coffee:

We welcome any contribution in form of [issues](https://github.com/gooddata/gooddata-js/issues) or [pull requests](https://github.com/gooddata/gooddata-js/pulls).

Install [Node.js](http://nodejs.org) and [Yarn](https://classic.yarnpkg.com) (for versions, see `docker/.config`)

These commands may come in handy while developing:

| command | description |
| ------- | ----------- |
| `yarn install --frozen-lockfile` | first step |
| `yarn dev` | build gooddata-js to `/dist` in watch mode |
| `yarn test` | run unit tests in watch mode |
| `yarn validate` | validate codestyle (tslint) |
| `yarn build` | build commonjs `/lib` and bundle files to `/dist` |
| `grunt yuidoc:compile` | build yui docs to `/docs` |

> Do not forget to update *CHANGELOG.md* when contributing.

## Publishing

:heavy_exclamation_mark: **Only for internal gooddata developers** :heavy_exclamation_mark:

### NPM package publishing

Package publishing is done via Jenkins Job:

https://checklist.intgdc.com/job/client-libs/job/gooddata-js-release/

### SDK API documentation publishing

To publish API documentation [sdk.gooddata.com/gooddata-js/api](http://sdk.gooddata.com/gooddata-js/api) you have to prompt following commands:

| command | description |
| ------- | ----------- |
| 1. `yarn build` |  |
| 2. `grunt bump-gh-pages` | Publishes documentation |

## Changelog
- see [CHANGELOG.md](CHANGELOG.md)


## License
(C) 2007-2021 GoodData Corporation

For more information, please see [LICENSE](https://github.com/gooddata/gooddata-js/blob/master/LICENSE)
