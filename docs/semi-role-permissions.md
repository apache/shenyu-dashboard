# Semi role permissions

The role editor now uses Semi Form, Modal, inputs and native checkbox trees.
Each permission root owns a controlled tree; changes merge with grants from the
other roots. Related parent/child selection emits leaf keys, and submission
expands those keys to ancestor paths and deduplicates the resulting permission
IDs. The backend request shape is unchanged.

Plugin search remains a case-sensitive match against direct plugin names.
Filtering changes visibility, not grants: hidden selections survive both edits
to another root and selection of a matching plugin in the same root. The tree
mapper sorts and annotates copies instead of mutating shared backend nodes.

The shared form owner recognizes `sysRole.id`, so replacing the edited role
resets both dirty inputs and the previous role's tree selection. Create mode
continues to accept the caller's empty permission objects.

Validation:

- Seven contracts passed on the original AntD editor before migration: existing
  grants/ancestors, parent cascade, cross-root merging, deselection, hidden grants
  in both the same and another root, required name and create defaults.
- Nine tests pass on Semi, adding record-switch isolation and shared-tree
  immutability. Full suite: 76 suites / 512 tests passed.
- Lint and production build passed; existing unrelated lint warnings remain.
- Against the real local Java/H2 Admin, a newly created test role received a
  keyboard-selected configuration root plus the divide plugin branch. The 75
  submitted permission IDs exactly matched both the expected branch union and
  authenticated API readback. No existing administrator role was modified.
- Reopened editor at 390x844: bounds x=16, y=23, width=358, height=798; no nested
  forms or page errors. The body scrolls while footer actions remain reachable.

The outer dashboard still has its legacy minimum width. Remaining AntD pages,
React upgrade, Vite migration and global theme/accessibility work are separate
stages.
