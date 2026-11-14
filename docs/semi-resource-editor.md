# Semi resource editor and icon picker

Resource forms and the icon picker now use Semi controls. Menu/button payloads,
resource-type restrictions, edit-only disabled fields, forbidden plugin-root
parent selection and legacy icon names are preserved. The icon field is read-only;
keyboard buttons open the picker or clear the field and its preview.

## Icon compatibility

The 365 catalog names are persisted Admin data. The picker reuses their existing
outline SVG definitions from `@ant-design/icons@2.1.1` and renders SVG directly,
without AntD's React icon component. The already-installed data package is now an
explicit dependency at the same version. The lockfile changes only the root
declaration; resolved packages and versions are unchanged. The package retains
its MIT license.

A SHA-256 contract captured before migration checks the SVG viewBox and paths
for all 365 choices, seven legacy alias/suffix cases and an unknown name. It
passes against the new renderer. Unknown/null names render no glyph, including
names that would collide with ordinary object-prototype keys. The complete SVG
dataset is retained; chunk sizes should be rechecked when AntD is removed.

## Keyboard and dialog behavior

Each icon is a real button. Search retains the existing trimmed, case-sensitive
matching and reports an empty result in English/Chinese. Selecting, cancelling
or clearing returns focus to the chooser. Suffix button events do not bubble to
Semi Input's focus handler. Parent cancellation is ignored while the picker is
open, so document Escape closes only the child and preserves the resource draft.

Shared Input/TextArea adapters map the legacy `readOnly` prop to Semi `readonly`.
The picker uses a responsive, scrollable grid and theme colors.

## Validation

- Five resource contracts passed on AntD before migration. Fifteen focused cases
  now cover form/picker behavior, glyph compatibility, unknown names, clear/focus
  restoration, empty results and nested Escape. The Escape regression failed
  before the parent guard and passes with it.
- Full suite: 80 suites / 538 tests passed. Production build and lint passed;
  unrelated existing lint warnings remain. npm 10 dependency-tree validation
  (`npm ls --all`) reported no problems.
- Build-reported gzip sizes: entry 550.73 KB and resource chunk 11.66 KB; the
  preceding stage reported 550.67 KB and 9.24 KB respectively.
- Real local Java/H2 Admin: keyboard selection/clear, focus return, child-only
  Escape, read-only icon field and menu/button create/readback passed. Menu icon
  `home`, zero sort and parent ID were retained; button icon `search` and its
  permission string were retained. Both temporary records were deleted and
  authenticated detail reads confirmed their absence.
- At 390x844, resource form bounds were 358x682 and picker bounds approximately
  358x670, both inside the viewport. No nested forms or browser page errors.

The resource list/tree, outer dashboard shell and other AntD consumers remain
separate migration work. React/Vite upgrades are not completed by this stage.
