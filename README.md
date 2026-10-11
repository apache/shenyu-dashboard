# Apache ShenYu Dashboard

![build](https://github.com/apache/shenyu-dashboard/workflows/build/badge.svg)
[![Contribute with Gitpod](https://img.shields.io/badge/Contribute%20with-Gitpod-908a85?logo=gitpod&color=green)](https://gitpod.io/#https://github.com/apache/shenyu-dashboard)


## Overview
Apache ShenYu Dashboard is frontend of a management background for [Apache ShenYu](https://github.com/apache/shenyu). The API interface is in the [Apache Shenyu Admin](https://github.com/apache/shenyu/tree/master/shenyu-admin) module.
                                                                                                   
## Prerequisite
- Node.js 20.x and npm 10.x (the test and build CI baseline). Run `nvm use`
  if you manage Node.js with nvm; the version is recorded in `.nvmrc`.

## How to Build

### Configuration

Modify the api url for different environment, eg: `http://192.168.1.100:8000`


### Develop Environment

```shell
# install dependencies in this project root path.
npm ci
# start
npm start
```

### Production Environment

```shell
# install dependencies in this project root path.
npm ci
# build for production
npm run build

# copy to apache-shenyu-admin
cp -rf dist/* shenyu-admin/src/main/resources/static/
```

## Tests

Install dependencies with `npm ci`, then run:

```shell
# Run all unit/component tests once and exit (also available as npm test).
npm run test:unit

# Run tests under src/components only.
npm run test:component

# Run a single test file.
npm run test:unit -- src/components/Authorized/CheckPermissions.test.js

# Run all tests and generate coverage reports.
npm run test:coverage

# Opt into interactive watch mode while developing.
npm run test:watch
```

Tests use Jest and jsdom; no ShenYu Admin backend, development server, browser
installation, or credentials are required. Test files live next to their source
as `*.test.js` or `*.spec.js`. The test Babel configuration reuses the project's
syntax preset independently of Roadhog's browser build configuration. New render
tests can use React Testing Library 12, which supports the current React 16 stack.

The build workflow runs `npm run test:coverage` on pull requests. A failing test
returns a nonzero exit code and fails the job. Coverage includes untested JavaScript
source files; view `coverage/index.html` locally or download the
`unit-test-coverage` CI artifact. LCOV and JSON summary reports are also generated.
This is an initial baseline, with no coverage threshold imposed yet.

### Migration from the old test commands

`npm test` now runs the unit/component suite once. `npm run test:all` is retained
as an alias for that same suite and no longer starts a development server.
Use `npm run test:watch` explicitly for watch mode.

The old Puppeteer home/login examples, development-server test runner, and browser
dependency installation script were removed. They asserted Ant Design Pro content
and outdated login behavior rather than current ShenYu workflows (see
[issue #652](https://github.com/apache/shenyu-dashboard/issues/652)). There is
currently no business E2E suite. Browser tests with a disposable ShenYu Admin
environment are follow-up work tracked in
[issue #657](https://github.com/apache/shenyu-dashboard/issues/657).
