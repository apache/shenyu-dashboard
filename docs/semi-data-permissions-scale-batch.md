# Data permissions and Scale migration

DataPermModal and the Scale list now use Semi controls. These remove two direct
production AntD consumers (17 to 15); the remaining consumers are primarily
login, layout, navigation and authorization/router adapters. React 18 and Vite
are not part of this batch. No dependencies, models, service endpoints or backend
code change.

Data permissions retain immediate per-record grant/revoke behavior and the
existing `userId`/`dataId` write payloads. The namespace chooser, plugin tree,
selector table and independently paginated expanded rule tables migrate together.
Categories cannot be selected; plugin selection is controlled; rows use data IDs.
Empty data sources are explicit arrays for the native tables.

The permission modal guards async callbacks at three levels: scope generation
(user/namespace/plugin), latest selector request, and independent rule request
tokens for each expanded selector. Tokens do not repeat after collapse or page
changes. Older replies cannot repopulate the current scope or overwrite a newer
page. User changes clear loaded permissions; unmount invalidates all pending data
callbacks. Grant completions refresh only the active scope and its currently
expanded rule page. This ignores obsolete UI callbacks; it does not cancel or
undo a grant already submitted for its original user/data IDs. Rule queries also
carry the selected namespace; backend authorization/isolation is not inferred.

Scale uses native tables, switches, permission-rendered keyboard buttons, one
page-size callback and an Enter-submit filter form. Zero bounds remain visible.
Deletion retains metric/type/status filters, uses the existing model-owned single
reload, and updates the pager only after success when the final page disappears.
Both policy and rule switches require the existing edit permission; without it
they remain visible but disabled. Policy times render as complete read-only text
instead of clipped disabled picker inputs. Existing numeric flags and time
serialization (`YYYY-MM-DDTHH:mm:ss[Z]`) are unchanged; this is not a timezone
conversion redesign.

Validation:

- Six baseline contracts pass; five newly introduced regression cases fail on the
  previous code (obsolete permission responses/completions, zero bounds, deletion
  filters). A separate read-only status regression also fails before gating.
- All 120 suites / 807 tests pass; lint, production build and whitespace checks
  pass. Existing unrelated tooling/style/test warnings remain.
- Rendered tests cover plugin leaf selection, precise grant/revoke IDs, independent
  expansions, reversed replies, collapse/re-expand, changed target user, unmount,
  native pagination, Enter search, deletion success timing, zero values, policy
  times and read-only status controls.
- Isolated Chromium against the production build verifies selector grant, rule
  revoke, nested rule paging, a deliberately delayed response after a namespace
  switch, Scale rule editing, policy status updates, a single filtered deletion
  refresh with page fallback, and disabled policy/rule switches without edit
  permission. No page errors are observed.

All target users, namespace/plugin/permission records, Scale records and writes
in browser validation are synthetic or intercepted. Local Admin authentication
and base menu/permission reads are real, with explicit fixture additions. No real
user permissions, scaling policy, database or gateway configuration are changed;
no test notification, scaling action or pressure test is triggered. Backend
permission propagation and scaling execution are not validated. Comprehensive
Scale query-order handling is outside this migration.
