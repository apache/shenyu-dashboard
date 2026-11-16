# Semi alert receiver list

The alert receiver list uses Semi Table, confirmation and buttons plus the shared
switch control. It follows the application table locale, wraps toolbar actions,
and exposes keyboard-accessible edit buttons with permission-provided icons.
Status text remains visible beside a receiver-specific accessible switch.

Pagination has one combined callback. Changing page size resets to page one and
issues one namespaced query. Existing mutation ownership remains unchanged: add,
edit and status callbacks refresh the list; deletion reloads through the model,
retains namespace and moves back when deleting the final row of a later page.
Selection and dialog cancellation do not query the list. Receiver IDs, detail
fields and boolean status values are retained in updates.

Validation:

- Eight behavior tests pass before and after migration; the added pagination
  test covers a later-page size change with exactly one namespaced request.
- Full suite: 88 suites / 608 tests pass. Lint and production build pass, with
  existing unrelated lint warnings.
- Real Java/H2 Admin: create disabled receiver in a non-default namespace,
  verify absence from default namespace, change page size with one request,
  enable via the list, edit email and disable via the dialog, then read back.
  Edit retains namespace ownership and the settled switch renders disabled.
  Keyboard row selection does not fetch; deletion submits only the owned ID and
  retains the namespace while preserving pre-existing records. The temporary
  receiver is removed. No page errors or test-notification requests occurred.

The shared shell still wraps its long namespace title at this viewport; global
shell/layout modernization remains a separate stage.

The existing backend `AlertTransfer.mapToAlertReceiverDTO` omits namespaceId,
so detail responses currently expose null. Frontend writes explicitly supply
the active namespace. Namespace ownership must be verified through namespaced
list queries, not by trusting this missing response field. This migration does
not change backend mapping or claim to fix it.
