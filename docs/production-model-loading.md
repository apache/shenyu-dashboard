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

# Production model loading (stage 3c)

Build on [stage 3b](async-shared-chunks.md), source base
`09094ed034431ed7089d30f9ffe5ff152464f1b7` / PR #743. The template require in
`dynamicWrapper` creates a directory context for `src/models`. Production stats
showed eight model test files and the unused `models/index.js`, whose own context
also scans that directory.

Replace only that production lookup with 21 explicit literal-require loaders.
Keep each require inside a function: model services import the request utility,
which references the bootstrap store, so preserve the existing evaluation order.
Do not replace them with eager top-level model imports. Reject missing or inherited
keys explicitly before model registration or page loading.

The existing namespace guard still prevents duplicate registration, including
`login` used by both the main route and login route. `global` remains separately
registered by the bootstrap. `getRouterData()` still builds all route wrappers and
registers their models synchronously at startup; this is not per-page lazy model
registration. Paths, route arrays, shared-chunk settings, effects/reducers, API
contracts and permission checks are unchanged. No dependency changes.

New route models must be added to this explicit loader list as well as the route
configuration. Unknown names now have a clear developer error. The unused
`models/index.js`, `spring.js` and `rewrite.js` source files remain untouched;
they leave the production graph because the broad context is gone. Model
hot-reload/bootstrap settings are unchanged.

## Verification

Before production edits, 30 route/model tests passed on the original loader.
Twenty-one cases check original module identity/namespace, synchronous registration
before loading a page and duplicate suppression. Three cases reject unsupported
names, including inherited object keys. Existing Metadata/model mocks remain;
store, API-base DOM and a TypeScript constant fixture isolate unit startup from
the browser application. These tests do not establish real Admin integration.

Final full coverage: **62 suites / 457 tests passed**. Lint, production build
with the existing TypeScript loader, Prettier and whitespace checks passed with
inherited warnings. Independent source inspection found no missing loader or
concrete initialization/registration regression.

A fresh base build and final build used the same worktree, environment and locked
dependencies. Webpack stats were captured after compilation with a local observer
that adds nothing to the application. Assertions check the exact set of 21 route
model files plus `global`, no model directory context and no test/spec modules.

| Production artifact | Base | Final |
| --- | ---: | ---: |
| Model test modules | 8 | 0 |
| Model directory contexts | 2 | 0 |
| HTML entry JS, gzip bytes | 447,340 | 439,626 |
| All generated JS, gzip files summed | 2,545,134 | 2,537,420 |
| Initial CSS, gzip bytes | 102,112 | 102,112 |
| Async files | 36 | 36 |

All 36 async files are byte-for-byte identical to the base build. Only the entry
JS changes. The same Python `gzip.compress(data, compresslevel=9, mtime=0)` method
gives **7,714 bytes** less total JS (about **0.30%**). The main result is the
correct production import boundary; this is not a measured load-time/QPS claim.

Production Chromium checks compare Login, Metadata, AppAuth, MCP and their three
editors between the base and candidate. Metadata saves submit identical DTOs,
including record ID, namespace, RPC type, booleans and optional fields. An unchanged
AppAuth resource set retains custom paths and closes with zero POSTs.

An isolated headless browser additionally verifies shared-chunk failure/retry,
English error recovery, delayed editor cancellation and cached reopening,
unauthenticated login redirect, `/admin/` relative chunks, a 358px dialog at a
390px viewport and MCP nested field values. The checks use local API fixtures;
[#657](https://github.com/apache/shenyu-dashboard/issues/657) remains open for
real Admin login/namespace/permission integration. AppAuth's disabled-grant guard
remains. No backend deployment, static Admin distribution or gateway load test
is included. React/Dva and build-tool replacement remain later stages.
