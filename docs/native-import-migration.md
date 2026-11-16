<!--
Licensed to the Apache Software Foundation (ASF) under one or more
contributor license agreements. See the NOTICE file distributed with
this work for additional information regarding copyright ownership.
The ASF licenses this file to You under the Apache License, Version 2.0
(the "License"); you may not use this file except in compliance with
the License. You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

# Standard dynamic imports (stage 3a)

Build on [stage 2c](semi-appauth-transfer.md). This is a build-modernization
prerequisite within the current React 16 / Dva / Roadhog runtime. It does not
upgrade React, Dva, Semi, or the build tool, or change API/permission contracts.

## Loading behavior

Remove Roadhog's `disableDynamicImport` option: its documented implementation
adds `babel-plugin-dynamic-import-node-sync`, which would turn `import()` into
synchronous `require()`. The existing route imports now produce actual deferred
route chunks. The Metadata editor/table, MCP Tools editor and AppAuth resource
editor use standard dynamic imports, with existing chunk names retained through
optional Webpack naming comments. The handwritten `require.ensure` wrappers
are removed.

Route wrappers consistently use the installed `react-loadable` Promise loader.
They no longer inspect function source text for `.then(` to guess how the build
transformed an import. Dva models still register synchronously and once per
namespace before the route loads. Existing hash URLs, route props, route data
and permission metadata are retained. Loaded routes are cached by their wrapper.

A route download failure displays a localized error with Retry, rather than
leaving a spinner indefinitely. The installed loader handles retry and suppresses
updates after unmount. Existing dialog/table cancellation and retry components
are retained. The AppAuth retained-disabled-grant protection remains in place
until the backend fix is deployed and real integration is verified.

## Validation

Before behavior changes, 16 tests passed on the original implementation: route
keys/permission metadata, model registration, and the four existing lazy-loader
suites. Final full coverage run: 62 suites / 433 tests passed. Six route tests cover
route metadata, model registration, a Promise loader without `.then(` in its
source, props/callbacks, failed-load retry with current props, unmount safety and
revisiting a cached route. Lint and production build passed with existing warnings.
The build's existing TypeScript loader completed; no new type-check tool is added.

Chromium smoke checks use the generated production assets and local HTTP API
fixtures. Verified:

- Metadata, MCP Tools and AppAuth hash links and their lazy editors.
- A deliberately aborted route chunk shows an error; the second request succeeds
  after Retry, in both English and Chinese.
- Aborted Metadata table/editor and AppAuth editor chunks recover through their
  existing Retry controls.
- Cancelling a delayed AppAuth editor keeps it closed when the response arrives;
  reopening reuses the downloaded chunk.
- A protected deep link without a token redirects to the login form.
- Relative route/editor chunks load under `/admin/`, including a 390px viewport
  with a bounded 358px AppAuth dialog and accessible footer.

The fixtures include a preview-only permission/bootstrap workaround already used
in earlier stages. These checks do not establish real Admin login, namespace or
permission integration; [#657](https://github.com/apache/shenyu-dashboard/issues/657)
remains open. No backend deployment, bundled Admin resources or gateway load test
is included.

## Asset tradeoff

The following compares the existing stage 2c production assets against this stage
with the same local Python `gzip.compress(data, compresslevel=9, mtime=0)` method.
It is an asset comparison, not a latency or throughput measurement. Route totals
sum the unique JavaScript files actually requested in the browser, without opening
an editor. Both stages retain the same initial CSS strategy.

| Compressed bytes | Stage 2c | Stage 3a |
| --- | ---: | ---: |
| HTML entry JavaScript only | 1,483,189 | 447,041 |
| AppAuth route, including required chunks | 1,483,189 | 727,680 |
| Metadata route and table, including required chunks | 1,919,008 | 1,069,792 |
| Initial CSS | 102,072 | 102,112 |
| All generated JavaScript files combined | 4,005,393 | 6,611,637 |

The existing Webpack 3 configuration duplicates dependencies among async chunks.
Although individual route startup downloads shrink, total generated JavaScript
increases by about 65%. Do not describe this as a total bundle reduction. Shared
chunk extraction, CSS splitting and deployment cache behavior need separate
measurement during the modern-build stage. React/Dva/router replacement, Vite
adoption, remaining forms and the static-distribution update remain later slices.

[Stage 3b](async-shared-chunks.md) measures and addresses the async dependency
duplication above; it retains the standard import and retry contracts.
