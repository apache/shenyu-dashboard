# Semi admin management batch

This batch completes the remaining AntD controls in plugin-template management,
namespace-plugin management and metadata management, including both metadata
loading/retry components. These five production files no longer import AntD.
The current tree has 47 production JavaScript files still importing AntD,
compared with 52 before this batch; this count is not overall project completion.

All three pages use shared toolbar/status/detail styles, keyboard actions and
permission-provided icons. Plugin tables use native Semi resizing and a single
pagination callback. Metadata keeps its existing lazy Semi table/editor boundary
and pagination API. Config popovers preserve zero values and show malformed
configuration text rather than crashing. Permission links are derived from copies
instead of mutating backend list rows.

Mutation refresh ownership is consistent:

- Plugin edit/create now reload page one once through the model. Template reloads
  retain role and namespace query fields. Generation retains the chosen page size
  instead of silently switching to 12, and sends the target namespace UUID.
- Namespace-plugin editing has one model refresh; namespace changes clear old
  selection/editor/page state. Delayed editor callbacks from another namespace
  are ignored, and the model does not save list responses for an inactive
  namespace. This is not a full same-namespace request-order guard.
- Metadata add/delete refresh page one once, while edit/copy/status retain their
  existing query context. Path, namespace and page size survive model reloads.
  Batch/single status callbacks no longer issue competing list queries.

Validation:

- The original three-page/editor/loader baseline passes 68 tests. Five new
  refresh/filter regressions fail before their fixes, and a separate inactive
  namespace-response regression also fails before its guard.
- Final focused coverage passes 94 tests. All 103 suites / 701 tests, lint,
  production build and diff whitespace checks pass. Existing unrelated warnings
  remain; no dependencies were added.
- Plugin browser checks first read both real local Admin lists successfully.
  Explicitly intercepted fixture writes then verify template status, edit, add,
  generation, resource creation and deletion, plus namespace status/edit/sync/
  deletion. Eight list-reloading mutations each issue one grid query. Numeric
  config changes retain an unknown false field; IDs/namespace UUIDs and synthetic
  file base64 are checked. Native resizing grows roughly 132px to 191px and
  survives page-size changes. No plugin binary/config/sync write reaches Admin.
- Metadata uses actual local Java/H2 Admin CRUD in a non-default namespace. Create,
  edit, copy, single status, batch status and delete each issue one query. API
  readback verifies persistence, distinct copy identity and absence in the default
  namespace. Only two owned temporary records are deleted; no browser page errors.
- Metadata editor/table loading, cancellation, retry and late-load tests remain
  passing. Native modal close-label casing changed, so its test is case-insensitive.

The artifact scripts/results live in the local frontend-completion handoff area:
admin-batch-plugins.cjs/result.json and admin-batch-metadata.cjs/result.json.
Screenshots were inspected. This batch does not validate real plugin installation
or gateway synchronization; no Linux load test was run. Remaining complex plugin
forms, authentication/MCP/Discovery, shell/mobile/theme, React 18 and Vite still
need subsequent batches.
