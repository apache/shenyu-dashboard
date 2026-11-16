# Apache ShenYu Dashboard

![build](https://github.com/apache/shenyu-dashboard/workflows/build/badge.svg)
[![Contribute with Gitpod](https://img.shields.io/badge/Contribute%20with-Gitpod-908a85?logo=gitpod&color=green)](https://gitpod.io/#https://github.com/apache/shenyu-dashboard)

## Overview

Apache ShenYu Dashboard is frontend of a management background for [Apache ShenYu](https://github.com/apache/shenyu). The API interface is in the [Apache Shenyu Admin](https://github.com/apache/shenyu/tree/master/shenyu-admin) module.

## Prerequisite

- Node.js 22 LTS or newer (24 recommended; CI builds on both). Run `nvm use`
  if you manage Node.js with nvm; the version is recorded in `.nvmrc`.

## How to Build

### Configuration

The Vite development server runs at `http://127.0.0.1:8000` and proxies API
requests to `http://localhost:9095`. Override the backend with
`SHENYU_ADMIN_URL=http://127.0.0.1:19095 npm start`. `npm run start:no-proxy`
disables the backend proxy; the obsolete Roadhog mock file (whose `mock/` inputs
were absent) is no longer loaded. It is not an offline mock backend.

Production assets use relative URLs under `static/`, with hash routing. The
`httpPath` element keeps Admin's Thymeleaf `${domain}` binding; standalone serving
falls back to same-origin relative APIs. Deploy the entire `dist/` directory,
including `index.html` and `static/`, without rewriting chunk names.

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
as `*.test.js` or `*.spec.js`. Jest 29 uses explicit Babel env and React presets independently of Vite's
browser build configuration. Render tests use React Testing Library 16 with
the current React 18 stack.

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

## UI migration

See the [Semi Design migration stages](docs/semi-migration.md) for the metadata
editor pilot, compatibility constraints, validation and later migration scope.

## Build tooling

Vite 7 replaces Roadhog/Webpack. Use Node >=22.12 (24 recommended), `npm run build`
for production and `npm run preview` for a local static preview (no API proxy).
`npm run analyze` adds source maps; it is not a bundle-size benchmark.
`npm run site` builds and publishes the dashboard to gh-pages when explicitly run.
The previous unused Roadhog API-doc generator is removed.

Bound Less styles use `.module.less`; `src/index.less` remains a global stylesheet. Babel handles legacy decorators before JSX transformation.
Jest remains independent with explicit Babel presets. The build emits a manifest
at `dist/.vite/manifest.json` for inspecting lazy chunks and deployment assets.
