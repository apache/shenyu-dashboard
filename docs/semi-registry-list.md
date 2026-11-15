# Semi registry list

Registry list controls now use Semi Table, native resizing, confirmations,
protocol tags and address popovers. The toolbar is a wrapping form with Enter
submission and permission-provided icons. English/Chinese table locale follows
the application, and the English password label is corrected.

Pagination uses one combined callback and resets size changes to page one.
Creation/update refresh the cleared first-page query through the model once;
cancelling a dialog does not fetch the list. Deletion retains submitted filters
and removes only confirmed IDs from selection. List responses are guarded by a
fresh query identity so older replies cannot overwrite newer results.

Validation:

- Eight existing/rendered cases passed before migration. Additional cases cover
  page-size request count, cancellation, mutation refresh context and the query
  response race (reproduced before its guard).
- Full suite: 85 suites / 595 tests, lint and production build passed, with
  existing unrelated lint warnings.
- Real Java/H2 Admin created a temporary loopback-address registry, resized its
  ID column, changed page size with one request, edited address/group and read the
  result back. Registry ID stayed disabled and untouched password was omitted.
- Filtered keyboard deletion sent only the owned row ID; detail readback confirmed
  removal and the refresh retained ID/address filters. No browser page errors.

These checks validate configuration CRUD, not connectivity to a live registry.
Other lists, React/Vite and the global shell/theme remain separate stages.
