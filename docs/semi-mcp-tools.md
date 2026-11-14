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

# MCP tool editor migration (stage 2b)

Build on the metadata table stage in [PR #739](https://github.com/apache/shenyu-dashboard/pull/739).
Migrate the MCP Tools modal's form, inputs, switches, parameter grid, mode selector,
tabs and buttons to Semi 2.87.0. Retain the React 16/Dva runtime, ReactJson widget
and existing notification calls. The AppAuth transfer flow and the separate MCP
JSON-edit dialog are subsequent migration slices.

## Preserved contracts

The caller owns selector, namespace and edit ID. The editor returns the existing
rule DTO: name, description, serialized handle, integer sort, boolean enabled,
logged/matchRestful, string matchMode and wildcard ruleConditions. Success closes
through the caller callback; rejected API submissions retain the editor/input.

Form mode keeps four required fields (name, description, sort and matchMode),
boolean false values and the handle-description fallback. The handle contains
recursive `parameters` arrays and a JSON string for `requestConfig`. Backend
`ShenyuMcpServerTool` accepts structured requestConfig for compatibility; JSON mode
keeps that existing input representation, while form mode serializes it. Reopening a structured requestConfig preserves its
parameters and defaultValue fields.

Array elements stay in `parameters[0]` with name `items`; do not replace the DTO
shape with a JSON-Schema `items` property. Retain other parameter properties during
normalization. The existing `MAX_NESTING_DEPTH=6` checks belong to form
mode; the backend model does not define that limit.

Direct JSON submission retains the original rule-level defaults: sort 1,
logged true, matchMode "0" and matchRestful false. Returning to form mode retains
unsaved form rule fields instead. Preserve this distinction when changing the
editor in a later stage.

## Implementation and corrections

Keep the Semi form mounted while JSON mode is visible. Synchronize through
`getFormApi` and `onValueChange`; merge existing values before `setValues`, whose
partial argument otherwise clears fields in this Semi version. The old 100ms/0ms
synchronization timers are no longer needed.

Retain malformed JSON drafts when a user requests form mode. Validate root and
recursive parameter-container shapes before updating the mounted form, so values
such as `parameters: {}` or `[null]` stay editable instead of crashing a render.
Normalize array element names recursively, including arrays nested inside another
array's object element. Parameter types, wire payloads and request-configuration
business rules otherwise follow the existing editor.

Load the editor in an `mcp-tools-modal` chunk. Before loading, show a cancellable
modal with a localized retry. Ignore results after cancellation/unmount. Keep the
existing Webpack 3 mechanism local to the loader until the build modernization.
The real editor bounds its scrolling body to the viewport so the footer stays
available for long parameter trees.

## Validation

The same 22 core DOM cases passed on both the original AntD and Semi components.
Eight further cases cover native submit, unsaved rule fields, invalid-mode drafts,
recursive normalization and malformed parameter containers. Four async-loader
cases cover loading/cancel, prop forwarding, retry and cancelled completion.

The full suite passes 59 suites / 396 tests. `npm run lint`, `npm run build` and
`git diff --check` pass; existing legacy/validator/style warnings remain. jsdom
supplies a no-op layout observer. The external ReactJson widget is replaced with
a small controlled test fixture for its event boundary; Chromium uses the real
widget and browser ResizeObserver.

Chromium checks on production assets and local API fixtures cover:

- Creating nested array/object parameters with a disabled `items` name.
- Form→JSON→form retaining unsaved sort, switches and match mode.
- Malformed structures remaining editable; no failed submit losing input.
- Actual create/edit payloads retaining caller selector/namespace/ID; JSON submit
  preserving its legacy rule defaults and preview tabs retaining the draft.
- First download failing then retrying; cancellation during a delayed download
  completing without reopening the editor.
- Chinese/English controls and desktop/tablet layout with visible footer.

The API fixture verifies UI behavior and transport payloads. Disposable Admin
integration remains tracked in [#657](https://github.com/apache/shenyu-dashboard/issues/657).
No real gateway or remote Linux workload was run for this UI change.

Production gzip measurements, same Node 22 build command:

| Asset | Table stage | MCP editor stage |
| --- | ---: | ---: |
| Initial JavaScript | 1,515,290 bytes | 1,496,377 bytes |
| Initial CSS | 160,311 bytes | 162,380 bytes |
| MCP editor chunk | none | 807,868 bytes (about 788.93 KB) |

Moving the editor out of the synchronous route reduces initial JS by 18,913 bytes;
CSS grows by 2,069 bytes under the legacy combined extractor. The editor adds a
download on opening. These are asset measurements; application performance and
real Admin integration require separate validation.
