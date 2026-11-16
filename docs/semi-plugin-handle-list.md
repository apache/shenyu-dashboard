# Semi plugin field management

PluginHandle management now uses Semi Table/native resizing, buttons,
confirmation, tags and detail popovers, with shared inputs/select and application
locale. The wrapping search form supports Enter and keeps immediate plugin/field
filtering. A single pagination callback resets page-size changes to page one;
selection does not fetch the list. Edit/copy actions are native keyboard buttons
with permission-provided icons.

Reload was incorrectly registered as a generator reducer. It now runs as an
effect and includes the field filter. Mutations have one model-owned refresh:
add/edit/copy retain the existing cleared-filter/page-one behavior, while delete
retains plugin/field filters and page size on page one. Cancelling only closes
the modal and does not fetch.

Plugin choices finish loading before dialogs open. Unmounted pages ignore delayed
loads/detail callbacks. Language changes update columns without recursively
refetching plugin options. Extension fields are decoded on copied records instead
of mutating the entire API list during every plugin-name cell render. Only the
four supported extension fields are copied, retaining zero values and record
identity; malformed JSON falls back to the original record fields.

Validation:

- Eight legacy list/form cases pass before migration. Three real dva-core model
  regressions fail before the reload fix and pass afterward.
- Sixteen focused cases cover field filters, edit/copy identity, extension values,
  one size-change query, model-owned refresh, cancellation, pending option loads,
  unmount and immutable extension decoding.
- All 93 suites / 640 tests, lint and production build pass with existing
  unrelated warnings.
- Real local Java/H2 Admin creates two temporary fields under the existing divide
  template. Add/edit/copy/delete each issue one expected list refresh. Readback
  verifies edited labels, string-zero default/required flags, numeric zero sort
  and new copy identity. Deletion submits only the two owned IDs and retains
  plugin/field/page-size filters; both temporary fields are removed.
- Native field-column resizing grows about 216px to 282px and survives page-size
  change. Selection and cancelling Add do not query the list. No page errors.

No existing plugin fields, plugin binaries, gateway traffic or backend source are
changed. Remaining AntD consumers, shared-shell/mobile work, React 18 and Vite
remain separate stages.
