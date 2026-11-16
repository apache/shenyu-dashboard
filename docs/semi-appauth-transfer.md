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

# AppAuth resource transfer migration (stage 2c)

Build on [PR #740](https://github.com/apache/shenyu-dashboard/pull/740). Replace the
resource-association modal and table transfer with Semi 2.87, preserving the
explicit mark → transfer → confirm workflow. The outer AppAuth table and other
application forms remain separate migration slices.

## Resource and payload semantics

Selection identity is the resource `path`; both Semi item `key` and `value` use
that path. Backend application-auth `id` stays independent of metadata/path-row
IDs. Submit `{id, authPathDTOList}` using the original resource objects, without
Transfer-generated `key`, `value` or `label` properties.

The update endpoint replaces the complete nonempty grant list. It has no
namespace field. Existing grants win catalog collisions and remain available
when metadata is missing. Duplicate raw grant entries are retained even when
the UI displays their path once. Searches only filter presentation; hidden grants
are preserved. Neither input arrays nor input objects are mutated.

Keep client-side paging and checkbox marks independently for both panels. Semi
Table with `pagination.currentPage` expects already-paged rows, so each panel
slices its filtered data before rendering. Search and transfer actions restart
panel paging; row marks can span pages until transferred. Item `disabled` flags
prevent marking/removing locked rows, distinct from backend grant `enabled`.

## Backend boundary and save behavior

The current [AppAuthServiceImpl.updateDetailPath](https://github.com/apache/shenyu/blob/master/shenyu-admin/src/main/java/org/apache/shenyu/admin/service/impl/AppAuthServiceImpl.java)
deletes/recreates submitted paths using [AuthPathDO.create](https://github.com/apache/shenyu/blob/master/shenyu-admin/src/main/java/org/apache/shenyu/admin/model/entity/AuthPathDO.java),
which sets `enabled(true)` instead of preserving
the DTO flag. This was also confirmed in Apache ShenYu master during this work.
The migration does not change that backend API.

- Confirming an unchanged nonempty path/app-name multiset closes locally without
  an API write, preserving row IDs and any disabled statuses.
- Empty drafts show validation instead of posting a payload rejected by
  `AuthPathWarpDTO.authPathDTOList @NotEmpty`. The endpoint cannot clear all grants.
- Changed sets that retain any existing `enabled:false` grant are blocked, so a
  resource edit cannot silently re-enable it. The path is visibly marked as
  containing a disabled grant. Backend status preservation needs a separate fix
  before this restriction can be removed.
- New grants may originate from disabled metadata; metadata availability flags
  do not define the authorization status. Preserve that existing API distinction.

Safe changed sets still use the caller-controlled save/close contract. Failed
API results retain the draft. Request tokens invalidate late loads, obsolete
submit callbacks and old save completions after close, unmount, namespace-context
changes or a newer editor request. The caller enforces the app-auth record ID.

## Loading and validation

Load the dialog in an `appauth-resources` chunk, with cancellation and localized
retry. Remove the former redundant full `antd/dist/antd.css` import; retained
AntD components still load their component styles through the existing Babel
configuration. Keep viewport bounds and stack panels on narrow screens.

Eight normal enabled-grant behavior cases pass on the original AntD and Semi
implementations. Additional regressions cover no-op/empty save, missing catalog
paths, immutable props, record switching, missing app names, duplicate grants,
right-panel paging, disabled rows, disabled replacement protection, caller-ID and
async callback ownership. Full checks: 61 suites / 427 tests, lint and production
build. Existing legacy/style warnings are retained.

Chromium uses production assets with local API fixtures to verify no-op zero-write
saves, rejected-save draft retention, complete replacement payloads, custom paths,
both-side paging/search, empty/disabled guards, lazy retry, locale and layout.
Real Admin integration remains [#657](https://github.com/apache/shenyu-dashboard/issues/657).
No remote Linux or gateway load experiment is part of this UI change.

Bundle measurements and final browser evidence are recorded with the PR. Bundle
size is an asset measurement; it is not a gateway-throughput claim.

Production gzip sizes compared with stage 2b:

| Asset | Before | Stage 2c |
| --- | ---: | ---: |
| Initial JavaScript | 1,496,377 bytes | 1,486,447 bytes |
| Initial CSS | 162,380 bytes | 102,236 bytes |
| AppAuth resource dialog | none | 500,085 bytes |

Initial CSS drops by 60,144 compressed bytes after removing the redundant global
sheet. Retained AntD buttons and the prior Metadata/MCP dialogs were exercised in
the browser after removal. The resource dialog adds a lazy download on opening;
this does not establish a reduction in total JavaScript or application latency.
