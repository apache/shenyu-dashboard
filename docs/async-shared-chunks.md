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

# Async shared chunks (stage 3b)

Build on [stage 3a](native-import-migration.md), source base
`2b1c57bd7bc59ef2b13d7522985060e13bb6820b` / PR #742. Route splitting exposed
repeated AntD/rc and Semi modules across async chunks. This stage uses the
existing Roadhog `commons` option; no dependency or runtime version changes.

## Extraction boundaries

Give the existing 26 route imports stable chunk names. The paths, registered
models, permissions, API calls and editor loaders stay the same. Explicitly
select 20 admin/layout routes for sharing; public login, user layout and error
routes remain outside that group. New routes still load correctly without being
listed, but shared-module membership should be rechecked when adding routes.

Roadhog passes each `commons` entry to the installed Webpack 3.12
`CommonsChunkPlugin`. The six passes are ordered: later passes see the remaining
modules after earlier extraction.

| Async chunk | Extraction rule |
| --- | --- |
| `route-shared` | Used in at least four selected routes, including the main layout or Metadata route |
| `admin-shared` | Remaining modules used in at least four selected admin routes |
| `semi-shared` | Intersection of all four named Semi table/editor chunks |
| `editor-shared` | Remaining intersection of Metadata, MCP and AppAuth editors |
| `form-shared` | Remaining Metadata/MCP form intersection |
| `table-shared` | Remaining Metadata table/AppAuth editor intersection |

The first route predicate uses Webpack 3's installed `Module.getChunks()` API.
This keeps unrelated admin widgets out of the thin Metadata route. The Semi
passes likewise keep form-only dependencies out of the metadata table. AppAuth
and MCP routes do not download Semi groups until their editors open. A direct
login route downloads no shared group.

These rules match the measured source graph, rather than serving as a universal
component adapter. Some small overlaps and the public route copies remain on
purpose. Re-evaluate the graph if route/editor dependencies change. The config
is specific to the existing Webpack build and must be replaced during migration
to a different builder.

## Measurements

A clean install and fresh production build of the unchanged base were run in the
same worktree before edits. Both builds use the unchanged lockfile and the same
Node/npm environment. A local observer captures Webpack stats after compilation;
it adds no module or plugin to the shipped application. No build-time claim is
made from these runs.

All sizes below are `gzip.compress(data, compresslevel=9, mtime=0)` bytes, using
Python 3.12.11 / zlib 1.2.12. Each route row sums the unique JS files
requested by a fresh Chromium context with local HTTP API fixtures. These are
normalized asset bytes, not actual transferred bytes, time-to-interactive or
backend throughput. The fixture server does not compress responses.

| Asset | Stage 3a base | Stage 3b |
| --- | ---: | ---: |
| All generated JS, individual gzip files summed | 6,611,623 | 2,545,134 |
| HTML entry JS only | 447,027 | 447,340 |
| Initial CSS | 102,112 | 102,112 |
| JS files generated | 31 | 37 |
| Compiled module objects present in multiple chunks | 3,257 | 355 |

Total JS drops **61.5%** against this fresh stage 3a base. The same compression
method gives 4,005,393 bytes for the retained stage 2c assets, so the reduction
against that earlier stage is **36.5%**, not 61.5%. The small entry/login increase
comes with the larger chunk-name map; the entry itself is not smaller.

| Loaded view | Stage 3a JS bytes | Stage 3b JS bytes | Script requests |
| --- | ---: | ---: | ---: |
| AppAuth | 727,666 | 666,516 | 3 → 5 |
| Metadata | 1,069,778 | 1,025,692 | 4 → 7 |
| MCP | 849,711 | 768,133 | 3 → 5 |
| Login | 580,132 | 580,444 | 3 → 3 |
| AppAuth editor | 1,225,237 | 1,151,071 | 4 → 9 |
| Metadata editor | 1,863,931 | 1,431,274 | 5 → 10 |
| MCP editor | 1,653,599 | 1,562,472 | 4 → 9 |

AppAuth, Metadata and MCP route download sets shrink 8.4%, 4.1% and 9.6%.
Opening the Metadata editor shrinks its full JS set 23.2%. The direct login set
increases by 312 bytes (0.054%) and remains three scripts. More asynchronous
files and requests are the tradeoff; real network latency and cache behavior
still need measurement against a real Admin environment.

For a reproducible byte comparison, retain each build's entire `dist` directory,
record the browser's unique requested JS filenames per view, then sum:

```python
sum(len(gzip.compress((dist / name).read_bytes(), compresslevel=9, mtime=0))
    for name in set(requested_js_names))
```

## Rejected intermediate groups

Keep the original and every candidate build/stat/network record separately.
The first two candidates were not adopted:

| Candidate | Total JS gzip bytes | Metadata route bytes | Outcome |
| --- | ---: | ---: | --- |
| One broad route group and one broad Semi group | 2,296,308 | 1,630,779 | Loads unrelated editor code for the metadata table |
| Separate Semi groups, broad route group | 2,544,474 | 1,100,555 | Metadata set remains 2.9% above base |
| Final layout/Metadata core split | 2,545,134 | 1,025,692 | Selected after route and recovery validation |

The final grouping is slightly larger overall than the broadest candidate;
its route boundaries avoid the large per-view regressions observed above.

## Verification and deployment

Before editing: 20 existing route/editor-loader regressions passed. Final full
coverage: 62 suites / 433 tests passed. Lint and production build, including the
existing TypeScript loader, passed with inherited warnings. Prettier and
whitespace checks passed. Independent source inspection found no concrete
configuration or runtime-contract defect.

Chromium with generated production assets verifies:

- The three existing editors and route/table deep links, including custom grants.
- Each of the six shared chunks deliberately fails once; the corresponding
  route/table/editor error UI retries successfully on its second request.
- English and Chinese route failure recovery.
- A delayed shared editor chunk completing after cancellation does not reopen
  the editor; reopening reuses the downloaded shared chunk.
- `/admin/` relative paths for every requested chunk; at 390px width the existing
  AppAuth dialog remains 358px wide with its footer accessible.
- A protected deep link without a token redirects to Login, with no API request.
  Both the unchanged base and candidate begin downloading the main layout before
  redirecting. This check does not assert zero layout-code downloads for such a
  redirect. Direct Login has no shared-chunk request.

API fixtures and their preview bootstrap do not prove real Admin integration;
[#657](https://github.com/apache/shenyu-dashboard/issues/657) remains open.
AppAuth's retained-disabled-grant guard remains. No backend deployment, gateway
benchmark or Admin static-resource distribution is included.

Publish all referenced hashed assets before switching `index.html`, and retain
the previous generation for cached tabs and rollback. A cache or deletion policy
that removes old chunks can defeat retry from an old entry bundle; this stage
does not supply a service-worker or deployment-cache migration.
