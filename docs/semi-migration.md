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

# Semi Design migration

Migrate in independently reviewable stages. Keep the Admin API, permissions,
namespace isolation, hash URLs and existing saved configuration contracts stable.
Each stage must retain the existing test suite and include regressions for its
changed behavior.

## Stage 1: metadata form pilot

Replace only the metadata create/edit modal with Semi Form and Modal. Preserve
the caller props, required fields, optional nullable values, edit ID, RPC options,
boolean enabled value and caller-controlled close behavior. The table, Dva models,
services, routing, React 16 and all other Ant Design pages remain on their current
implementation. Semi uses its own component class prefixes alongside Ant Design.
Import its base theme variables explicitly when using component subpaths; those variables
live on `body`, so coexistence is not complete CSS isolation.

Use an exact Semi 2.87.0 dependency as a migration bridge. Later 2.x releases add
Tiptap 3 dependencies whose React peers require 17+, while this application's
Dva 2.4.1 supports React 15/16. Do not use `--force` or `--legacy-peer-deps` to hide that
constraint. Re-evaluate the exact Semi version with the modern React stage.

Load the editor as a separate `metadata-modal` JavaScript chunk. The initial pilot
used `require.ensure` because the existing Webpack 3 build disabled native dynamic
imports globally. [Stage 3a](native-import-migration.md) removes that restriction
and uses standard `import()` for routes and editors.
Loading stays cancellable and failed chunk downloads offer a localized retry.
Keep Semi Form's `allowEmpty` enabled to preserve empty strings in API payloads.
Disable RPC Select motion so a quick confirmation commits the newly selected
RPC value without waiting for its closing animation.

The pilot must cover create/edit DTOs, every required field, nullable optional
fields, RPC selection, enabled edit restrictions, cancel, native form submit and
reopening with a different record. Run full unit/coverage, lint and production
build checks. Compare the generated assets and verify the modal in a browser
before proposing wider migration.

## Stage 2: table and complex business flows

The metadata-table implementation and validation are described in
[stage 2a](semi-metadata-table.md). The MCP tool editor is described in
[stage 2b](semi-mcp-tools.md), and AppAuth resource transfer in
[stage 2c](semi-appauth-transfer.md). Keep runtime modernization in separate PRs.

Migrate the metadata table with controlled server pagination, cross-page selection,
resizable headers and permission buttons. Exercise the MCP Tools nested form and
AppAuth permission transfer before choosing general adapters. Add browser tests
against a disposable Admin environment; unit mocks alone do not establish API
integration or permission equivalence.

## Stage 3: runtime and build modernization

[Stage 3a](native-import-migration.md) enables standard asynchronous imports and
route load recovery in the current runtime before replacing its framework/build
integration. Its asset tradeoff is recorded separately.

Replace the legacy Dva renderer/router integration and incompatible React peers,
then move through React 18.3 to React 19. Preserve reusable model/reducer/effect logic
where practical. Evaluate Vite with the real decorators, dynamic module loading,
CSS/Less, proxy and relative asset paths; do not combine all runtime rewrites into
the first component PR.

At that point upgrade the pinned Semi package with a fully resolved dependency
graph. React 19 requires its documented entry adapter; that adapter only supplies
Semi's internal `createRoot` and does not upgrade Dva.

## Stage 4: complete the UI and distribution transition

Migrate remaining complete forms/routes, component locale and design tokens;
remove Ant Design 3 and its old Icon/Less overrides only after their last consumer
is gone. Validate hash deep links, accessibility, language switches, real backend
flows and rollback to the previous static bundle.

A dashboard PR does not update Apache ShenYu's bundled Admin resources. The
subsequent static-artifact PR must identify the dashboard source and update
bundled dependency LICENSE/NOTICE material for Semi and its actual dependency
closure. Do not claim UI or gateway performance improvements without measuring
the relevant workloads.

## Pilot validation

The original Ant Design modal passed the same 14 contract tests before the
migration. The pilot adds clearing, recovery and locale cases plus asynchronous
loader coverage, bringing the full suite from 315 to 338 tests. Run:

```sh
npm ci
npm run test:coverage
npm run lint
npm run build
npm ls react react-dom @douyinfe/semi-ui @tiptap/react --all
```

A clean local install used npm 10.9.4 with Node 22.23.1, matching the current Node
22 CI lane. No peer-dependency override flags were used. The generated lockfile
also aligns its root engine metadata with the existing `package.json` engine.
The existing JS/LESS lint and browser-data-age warnings are separate follow-up
work; they are not suppressed by this migration. Negative validation and rapid
change/submit tests also emit validator/Semi development warnings; their
assertions check that validation and submission still complete correctly.

Approximate gzip sizes from the same local production-build command:

| Asset | Before | Pilot |
| --- | ---: | ---: |
| Initial JavaScript | 1.44 MB | 1.44 MB |
| Metadata editor JavaScript, downloaded on opening | none | 772.23 KB |
| Initial CSS | 112.11 KB | 153.14 KB |

The legacy CSS extractor still puts Semi styles in the initial stylesheet. This
pilot adds about 41 KB of compressed CSS and an editor download; it does not claim
a smaller total bundle or improved application performance. Use the modern build
stage to evaluate tree shaking and CSS chunk splitting.

Browser smoke checks must use the generated `dist` assets and exercise create,
edit, copy, each validation path, API failure without losing input, successful
close, cancel/reopen, RPC changes and language switching. Also deliberately fail
the editor chunk download and retry, then check the layout at desktop and narrow
viewport sizes. Local API stubs can check the browser-to-service payload and UI
behavior, but cannot establish real Admin integration. Keep the disposable Admin
E2E follow-up tracked in [#657](https://github.com/apache/shenyu-dashboard/issues/657).
