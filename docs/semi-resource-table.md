# Semi resource table and toolbar

The Resource directory now has no direct AntD widget imports. Its button table,
confirmation popovers, toolbar buttons and search controls render Semi components;
local CSS grid replaces the previous Row/Col layout. The search form applies a
query only when submitted, including Enter, and wraps without the old fixed-height
header overlap. The table scrolls horizontally when its columns exceed the pane.

Controlled row IDs, local sorting, cancel/confirm deletion and the previous
response-order guards remain intact. Table edit actions are real keyboard buttons.
The page supplies Semi's English/Chinese locale context, including table empty and
sorting states.

## Permission boundary

`AuthButton` accepts an explicit `children(permission)` renderer after checking
access. Native controls can consume permission icon metadata without adding
widget-specific cloning rules. Denied/revoked permissions do not invoke that
renderer. Existing element-child callers retain their AntD icon-injection path.
Consequently, the shared compatibility utility still imports AntD for those older
pages; this stage does not remove the project-wide dependency.

## Validation

- Thirty table/permission contracts passed before migration, including legacy
  button icons, nested confirmation icons, local sorting and selected deletion.
- Thirty-six focused cases now pass, adding permission-renderer/revocation,
  submit-only search, language switching, denied toolbar controls and menu-confirm
  propagation checks.
- Full suite: 81 suites / 566 tests passed. Lint and production build passed;
  existing unrelated lint warnings remain.
- Isolated Chrome against the real Java/H2 Admin preserved the latest menu under
  controlled delivery of actual responses, verified keyboard menu/table editing
  without reselection, and applied search through Enter.
- Real UI checks created a temporary menu and two buttons. Space selected all;
  Cancel sent no deletion and preserved both records. Enter confirmation sent
  exactly their two IDs. Both buttons and the menu were then deleted through the
  UI and authenticated reads confirmed absence. Dialogs still fit 390x844 with no
  nested forms or page exceptions.

The browser harness waits for popover positioning before programmatic keyboard
focus. An early-focus probe could reopen an initializing popover; the positioned
mouse and keyboard paths both closed normally. No product workaround was added
for that pre-positioning probe.

The previously recorded backend empty-list application code 500 behavior is
unchanged. Shared legacy consumers, React/Vite migration and outer-shell theme /
responsive work remain later stages.
