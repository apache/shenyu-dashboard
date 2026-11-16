# Semi dynamic fields and system configuration forms

This stage follows `semi-system-forms.md`. Dictionary, namespace-plugin
configuration, alert and scale-rule dialogs now use Semi controls. Their request
payload construction remains unchanged. Alert label actions are native buttons,
so keyboard users can add and remove labels.

## Form compatibility

The shared form bridge now registers decorator-only fields (such as dynamic row
keys) as hidden Semi fields. They participate in validation, reset and values
without rendering an input or an additional form. Bound controls that unmount
are not re-registered as hidden fields. Reset also notifies the owning component,
so a virtual key-list reset removes the extra rendered rows. Changing record
identity continues to discard the previous draft.

Submit capture persists the React 16 event before Semi's asynchronous validation
completes. This preserves the existing `handleSubmit(event)` API without accessing
a recycled synthetic event. This bridge still requires an actual Form host;
form-less editable-table consumers are not covered by this stage.

## Validation

- The dynamic add/remove contract passed against the old AntD Form before the
  bridge change. Additional Semi tests cover reset and record replacement.
- Scale-rule contracts passed before and after migration: numeric type, zero
  bounds, status-to-integer conversion, required fields and cancel.
- Dictionary/configuration contracts and existing JSON-edit contracts passed
  before and after migration. They cover disabled values, zero sort, empty
  strings, JSON scalars, unknown configuration keys and actual JSON edits.
- Five alert contracts passed on both implementations: save and separate test
  callbacks, false switches, type-dependent fields, label add/remove, and hiding
  level filters. Hidden conditional fields are omitted in the old implementation
  too; the migration does not change that behavior.
- Full Jest suite: 73 suites, 496 tests passed. Lint and production build passed.
- Isolated headless Chrome against the real local Java/H2 Admin opened and
  cancelled all four dialogs at a 390px viewport: dialog width 358px, no nested
  forms and no page errors. Backend permission icons contribute to button
  accessible names; the browser check accounts for them.
- A real Dictionary UI create returned 200; authenticated API readback confirmed
  disabled state, string value `"0"` and numeric sort `0` were persisted.

The outer dashboard still has its legacy minimum width; dialog sizing is not a
claim that the whole dashboard is responsive. React 18, Vite, remaining AntD
consumers and full theme/accessibility cleanup remain separate work.
