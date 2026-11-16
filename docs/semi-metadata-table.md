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

# Metadata table migration (stage 2a)

This stage builds on the form pilot in [PR #738](https://github.com/apache/shenyu-dashboard/pull/738)
and keeps the existing toolbar, status cells, permission wrapper, service payloads,
React 16 and Dva runtime. The MCP nested-form and AppAuth transfer work remain
separate parts of stage 2.

## Behavior

- Load the Semi table as a `metadata-table` chunk. The existing route and hash URL
  remain the same; a localized loading/error view offers a retry on download failure.
- Keep backend pagination controlled by `currentPage`, `pageSize` and `total`.
  Preserve page-size options 12/20/50/100. Use only Semi Pagination's `onChange`
  callback and route size changes to the existing page-one handler, avoiding a
  duplicate fetch from separate page and size callbacks.
- Keep `id` as row identity and selected IDs across pages. Batch payloads use the
  controlled IDs, including rows absent from the current server page.
- Keep application/RPC sorting local to the loaded page, path-detail popovers,
  row/batch status actions, edit/copy entry points and permission fallbacks.
- Use Semi's built-in resizable headers in place of the Metadata page's AntD
  resize adapter. Column keys are stable, widths are explicit, and the operation
  column stays fixed on the right.
- Selection changes update local state without refetching the server page.
- Reset page, selection and open editor on namespace changes; reset selection
  on a changed path filter. Drop list responses and pending edit/batch lookups
  whose namespace is no longer active before applying them.

The namespace checks compare the active namespace identity. They do not replace
all request ordering/cancellation behavior inside the existing Dva runtime.

## Validation

Eleven DOM behavior tests first passed on the original AntD table. Additional
regressions reproduced stale selections and old-namespace callbacks before the
fixes. The final suite has 57 passing suites / 362 tests, including 24 new cases
covering the table, async loading and namespace responses. The table and
permission wrapper render their real implementations in these tests. Select
popup motion is disabled only in jsdom; browser checks keep default motion.

Run `npm run test:coverage`, `npm run lint` and `npm run build`. Existing legacy
React/Dva, validation, stylelint and browser-data warnings are retained.

Chromium checks with production assets and local in-memory API fixtures verify
36-row pagination, retained selection on returning to a page, cross-page batch
status, delete, path filtering, one query per page-size change, column dragging,
read-only permissions, English/Chinese empty state and a deliberately failed
chunk download followed by retry. A dragged header grew by approximately 80px.
These fixtures are UI evidence; disposable Admin integration remains tracked in
[#657](https://github.com/apache/shenyu-dashboard/issues/657).

Production gzip sizes from the same Node 22 build:

| Asset | Form pilot | Table stage |
| --- | ---: | ---: |
| Initial JavaScript | 1,514,875 bytes | 1,515,290 bytes |
| Initial CSS | 156,817 bytes | 160,311 bytes |
| Metadata editor chunk | about 772.23 KB | about 772.23 KB |
| Metadata table chunk | none | about 427.74 KB |

The initial JavaScript adds 415 compressed bytes and CSS adds 3,494 bytes relative
to the form pilot. The table adds a download on visiting the metadata page. The
legacy extractor still combines component CSS into the initial stylesheet;
there is no claim of improved application performance or a reduced total bundle.
