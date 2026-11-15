# Semi dictionary management

Dictionary management now uses Semi Table with native column resizing, actions,
confirmation, tags and detail popovers, plus shared inputs/switches. It follows
the table locale, wraps toolbar controls and uses keyboard-accessible edit/copy
buttons with permission-provided icons. Status labels sit beside switches so
English text is not clipped inside the thumb. Search supports Enter while retaining
immediate filter queries. One pagination callback resets page-size changes to
page one; selection no longer queries the list.

The model's reload generator was incorrectly registered as a reducer. Real
application-store regression tests show that add/update/delete/status success
never performed the expected model reload. It is now an effect, and mutation
refreshes have a single owner in the model. Component callbacks only close/reset
local UI. Add/delete/batch status reload the first filtered page; edit/copy and
single-row status retain their page. All refreshes retain type/code/name filters
and page size. Copy still omits the source ID; edit retains it, and zero/false
form values and permission behavior remain intact.

Validation:

- Eight old-list/form cases pass before migration (legacy fixed columns render
  duplicate action text, so baseline selectors account for that).
- Four real dva-core store tests fail before the reload fix and pass after it,
  covering add, update, delete and status effects without replacing the model
  state with a generator object.
- Sixteen focused tests and all 91 suites / 628 tests pass; lint and production
  build pass with existing unrelated warnings.
- Real local Java/H2 Admin: create a temporary dictionary type, edit, copy, toggle
  one row, toggle the selected rows and delete only the two owned IDs. Each of
  the six mutations emits exactly one filtered refresh. API readback verifies
  generated copy identity, persisted edit/status, false, string zero and numeric
  zero. All temporary records are removed; no browser page errors occur.
- Native name-column resizing grows about 200px to 260px and survives page-size
  change, which issues one request. Checkbox selection issues none. Resize checks
  wait for the success toast to disappear so its overlay cannot intercept the grip.

No backend changes are included. Remaining AntD consumers, React 18, Vite and
shared-shell/mobile work are separate stages.
