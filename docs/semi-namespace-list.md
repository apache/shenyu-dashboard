# Semi namespace list and scope transitions

The namespace list now uses Semi Table, native column resizing, pagination,
confirmation controls and permission-aware toolbar buttons. The SVG resource icon
renderer moved to shared UI code without changing its verified artwork.

## List and permission contracts

- Page changes use one combined pagination callback. Changing page size resets to
  page one with one list request; checkbox selection does not fetch the list.
- Default namespace rows remain non-selectable and are excluded from deletion
  payloads. Detail lookup uses the namespace UUID, while mutations use row IDs.
- Toolbar actions now use `system:namespace:*`, matching NamespaceController,
  instead of the previously copied plugin permission names.
- Rendering no longer adds unused URL properties to shared namespace records.
  Native resizable columns preserve widths across pagination updates.
- Reloads retain the namespace UUID filter. Each list request owns a fresh query
  snapshot, so an older response cannot replace a newer result even when their
  filter values are identical. Creation resets to page one and lets the model
  own the refresh rather than issuing competing page queries.

## Deleting the current namespace

The full namespace catalog, current page and clicked record resolve the deleted
UUIDs. The delete effect reads the active namespace after the server responds,
so a callback cannot restore an old context merely because the user switched
while waiting. Confirmed deletion removes only the deleted checkbox IDs.

If the active namespace was deleted, the component batches the default-namespace
switch with permission loading. `refreshAuthMenus({ permissionsCleared: true })`
uses the existing foreground permission loader, which the route guard waits for;
ordinary callers retain their background refresh. Local state updates are skipped
when the original page has unmounted. This also works when the active namespace
is not the first batch item or is selected from another table page.

## Validation

- Six existing/rendered baseline cases passed before migration. Four regressions
  were reproduced before fixes: second-item fallback, selection-triggered fetch,
  wrong toolbar grant and dropped UUID filter. An identical-query response-order
  regression was also demonstrated before its guard.
- Full suite: 83 suites / 585 tests passed. Lint and production build passed,
  with existing unrelated lint warnings. The relocated SVG catalog digest passes.
- Real local Java/H2 Admin: default-row protection, temporary namespace creation,
  filtering, keyboard selection and deletion passed. Native column resizing
  changed 300px to 360px and retained that width after changing page size to 20;
  the size change issued exactly one request for page one.
- The active test namespace was deliberately the second displayed batch item.
  After deleting both test spaces, the app stayed on the namespace page, selected
  the default UUID and requested permissions for that default UUID. API reads
  confirmed both temporary spaces absent and the default space intact. No browser
  page errors occurred.

Browser checks use the existing Home-page namespace selector because management
pages intentionally hide it. The default namespace and pre-existing test data
were not modified. Registry/User lists, remaining AntD consumers, React/Vite and
global shell/theme work remain separate stages.
