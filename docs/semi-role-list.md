# Semi role list

Role management now uses Semi Table, buttons and confirmation with the shared
input control. The table follows the application language, actions retain their
permission keys/icons, and edit is a keyboard-accessible button. The wrapping
search form supports Enter without querying on every keystroke. A single
pagination callback resets page-size changes to page one and retains the role
name filter.

Role payloads, permission-tree editing and model refresh ownership are unchanged.
Editing passes the selected role ID and complete currentPermissionIds. Creating a
role submits only its definition. Cancel and selection do not query the list.
The model continues to refresh the page and all-role lookup after mutations.

Validation:

- Five rendered list contracts pass before migration. With page-size coverage,
  the focused list, existing permission-form and shared pagination tests total
  28 passing cases.
- Full suite: 94 suites / 646 tests pass; lint and production build pass with
  existing unrelated warnings.
- Real local Java/H2 Admin creates a temporary unassigned role, searches with
  Enter, changes page size with one filtered request, edits through keyboard
  activation and deletes only the owned ID. Readback confirms the description
  change and unchanged empty permission set; all pre-existing role IDs remain.
- Each add/edit/delete issues exactly one paged-list request and one all-role
  lookup request, preserving existing refresh ownership. Cancellation/selection
  issue no list request. No browser page errors; temporary role removed.

No backend or permission-tree implementation changes are included. This stage
does not validate changes to assigned roles or complete React 18/Vite and the
remaining AntD/shared-shell/mobile migration.
