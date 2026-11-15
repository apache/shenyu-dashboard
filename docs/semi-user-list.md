# Semi user list

The user list now uses Semi Table, buttons, confirmation and shared controls.
The toolbar supports Enter submission and wraps its controls; row actions are
keyboard-accessible buttons with permission-provided icons. Table locale follows
the application language. A single pagination callback resets page-size changes
to page one without duplicate requests.

Administrator rows remain protected from selection, status changes, editing and
permission configuration. Unauthorized status cells remain read-only. Status
updates retain the user ID, name and boolean value; edit keeps password omission
and existing mutation-refresh ownership. The data-permission dialog is unchanged.

The list model also ignores stale responses using a fresh query identity, including
concurrent requests with identical parameters. A regression test reproduced the
older response overwriting the newer list before the guard was added.

Validation:

- 14 focused tests cover admin protection, permission visibility, status payload,
  edit/permission identity, pagination, existing dialogs and response ordering.
- All 87 suites / 602 tests pass. Lint and production build pass with existing
  unrelated warnings.

- Real Java/H2 Admin: protected admin controls, exactly one page-size query,
  Enter search, temporary-user creation, persisted status disabling, edit without
  password submission, permission-dialog opening and exact-ID deletion all pass.
  An unfiltered successful list read confirms removal; deletion retains filters.
  The headless Chrome run reports no page errors and cleans up its own user.

Integration also exposed two existing backend contracts: creation forces
`enabled=true` despite a correctly submitted `enabled=false`, and an empty user
search returns application code 500 rather than an empty page. The existing list
model displays that response as an empty list. Neither backend behavior is changed
or claimed fixed by this frontend migration. The creation behavior is implemented
in `DashboardUserDO.buildDashboardUserDO`; it needs a separate backend fix.

React 18, Vite, remaining AntD consumers and global shell/mobile work remain
separate stages.
