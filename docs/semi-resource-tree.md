# Semi resource navigation

The resource menu tree now uses Semi with controlled selection, SVG resource
icons and keyboard-focusable menu labels and actions. The button table and
remaining toolbar controls retain their existing components in this stage.

The tree sorts and translates copies of server nodes. The parent selector now
reads `meta.title` explicitly instead of relying on the old tree renderer to
mutate menu objects. Search remains case-insensitive and retains matching
ancestors; Semi's `expandAll` keeps those results expanded when filtered data
changes. Empty-search text uses the application translations.

## Selection and asynchronous responses

Selecting a menu clears the previous rows and checkbox IDs. Button reads are
scoped to the current menu, latest request and mounted component, so a late
response for A cannot overwrite B after the user switches menus. Parent
selection leaves the button table empty.

After a confirmed deletion, only the confirmed button IDs are removed from rows
and checkbox state. New selections made while the deletion was in flight remain
selected. Deleting the current menu clears that selection; a delayed deletion
callback for a different menu does not reset the current view.

Parent and leaf edit actions both honor the existing edit permission. Plugin
menu deletion remains unavailable. Keyboard action events do not also select
the containing tree item or issue duplicate button-list requests.

## Existing backend limitation

The integration Admin's `GET /resource/button` returns HTTP 200 with application
code 500 / `query failed` for an empty list (`ResourceController.getButton`).
This change does not reinterpret that error as success. A confirmed deletion
updates the visible rows immediately, so a failed empty-list refresh cannot
leave already-deleted records on screen. The backend empty-list contract and
its warning notification remain a separate follow-up.

## Validation

- Five rendered contracts passed against the old tree before migration.
- Two old response-order regressions were reproduced before the request guards.
  Browser-discovered expansion/deleted-row regressions and a deletion/checkbox
  race were also locked with failing tests before their fixes.
- Seventeen resource-page tests pass. Full suite: 81 suites / 555 tests passed;
  lint and production build passed, with existing unrelated lint warnings.
- Isolated Chrome against the real local Java/H2 Admin deliberately delayed one
  actual button-list response until a second completed. The second menu's seven
  rows remained intact. Keyboard selection/edit, no duplicate edit read, parent
  clearing and case-insensitive search passed without page exceptions.
- Real UI menu/button creation, readback and deletion passed. Deleted selection
  was cleared, both temporary records were confirmed absent, and resource/icon
  dialogs still fit 390x844 with no nested forms.

React/Vite migration, the remaining AntD consumers and complete outer-shell
responsiveness/theme work are not completed by this stage.
