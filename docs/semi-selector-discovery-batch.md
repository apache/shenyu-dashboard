# Selector and Discovery migration

This batch migrates the common selector/rule lists, Selector dialog and the
complete Discovery UI (proxy list/cards/icons, configuration, proxy-selector,
copy/import dialogs and editable upstream table) to Semi. Ten production files
stop importing AntD directly: 27 consumers become 17. No dependency or backend
change is included.

The upstream table now owns a controlled row draft rather than an AntD Form
without a form element. It does not register fields into either parent dialog or
nest HTML forms. Save validates editable required fields, accepts zero/false,
merges into the exact row key, and preserves server IDs and read-only discovered
addresses/startup times. Cancel and pagination discard the draft; gray toggles
copy the row instead of mutating parent data. New client keys use the row counter
without coercing large string server IDs to JavaScript numbers.

Semi's uncontrolled table pagination must retain its internal `onChange`:
row-draft cancellation listens to the table's pagination event instead. A
rendered second-page edit test caught the incorrect callback placement during
migration and verifies the corrected behavior. Updating a table's data source
uses Semi's default page-reset behavior; row identity is independent of page.

Both parent dialogs use the shared Semi form owner. Their tab fields mount
eagerly and remain registered across tab switches. The Selector time controls
use native Date values and explicit string-first callbacks, preserving the
existing condition format. Source-copy selection is controlled and searchable.
The existing unsaved-upstream confirmation in the common Selector is retained.

The common lists use one combined pagination callback, explicit row IDs,
permission-rendered buttons, native keyboard actions and locale-aware controls.
Checkboxes, switches and row actions do not activate selector rows. Selector
reloads carry the child rule page size. A new selector clears old rule selections
and search; selector-list refresh resets the displayed child pager to match the
model's first-page response. Mutation refreshes retain current filters. These
are bounded UI fixes, not comprehensive response-order guards for shared models.
Discovery search starts on page one. Cards use native permission-gated controls
and a responsive grid; toolbar height can grow instead of clipping controls.

Validation:

- 66 baseline common/Discovery tests pass, including five new rendered upstream
  contracts against the previous implementation. Regressions reproduce parent
  row mutation, stale rule selection, missing child page size and proxy search
  pagination before their fixes.
- All 119 suites / 791 tests pass. Lint, production build and whitespace checks
  pass; existing unrelated warnings and the legacy Less `:global` warning remain.
- Tests cover required validation, cancellation, local/discovered editability,
  later-page identity, large IDs, parent/row submission separation, zero/false,
  read-only registry configuration, card permissions and exact action identities.
- Isolated Chromium checks the production build served by local H2 Admin:
  selector/rule page sizes remain aligned, checkbox selection does not activate
  a row, ordinary-selector and TCP upstream edits save zero/false values, card
  refresh/delete target the expected identities, and registry rename retains its
  disabled connection fields and namespace. No browser page errors occur.
- The prior six-rule-editor browser workflow also passes against the new common
  lists, including request header edits, all protocol tabs, date/time conditions,
  zero/false payloads and rule copying.

Browser plugin/selector/rule/proxy/registry data, extra UI permissions and all
writes are synthetic/intercepted. The local Admin session/base permissions are
real. The prior Hystrix regression supplies its missing backend enum explicitly.
No real registry endpoint, gateway configuration, database write or pressure test
is performed. This does not validate live discovery connectivity, backend
permissions, or the legacy TCP top-level plugin configuration/status APIs.

Wide upstream tables remain horizontally scrollable. Shell/login/theme/mobile,
DataPermModal, Scale, remaining AntD adapters, React 18 and Vite are follow-ups.
Malformed backend JSON and comprehensive namespace/request-order handling are
not expanded by this migration.
