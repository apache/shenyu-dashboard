# Semi configuration transfer dialogs

Configuration import/export now use the shared Semi modal/form/select controls.
The chosen namespace is owned by the form rather than duplicated component state;
the existing default namespace and request payload names remain unchanged.
Choosing a transfer target does not change the dashboard's active namespace.

The upload control keeps the original File object and opens its own input through
a local ref. Previously document.getElementById("file") could open another form's
picker when that field ID was already present. Upload is explicitly a non-submit
button. File-required validation, cancellation and fresh state on reopen remain.

Import results use a Semi tooltip/modal without the unused form/Redux wrappers or
file-validation handler. Existing result fields and zero counts are retained;
long string messages are shortened visibly but remain complete in the tooltip.
The buttons use the application's translated confirm/cancel labels.

Validation:

- Eight baseline dialog/parser cases pass before migration. A duplicate-file-ID
  regression fails against the old global lookup and passes with the local ref.
- Twenty-one focused cases cover dialogs, parsing, model callbacks and download
  behavior. All 99 suites / 678 tests, lint and production build pass with existing
  unrelated warnings.
- A headless browser uses real local Admin namespace choices with explicitly
  intercepted transfer endpoints. It verifies selected namespace, multipart
  boundary, original file bytes/name, download filename/content, missing-file
  validation, zero counts, full tooltip content, cancellation and fresh reopen
  state. Active dashboard namespace is unchanged; no page errors occur.
- At a 390px viewport the transfer/result modals fit within 358px. The global
  shell's minimum width remains a separate limitation.

Transfer requests use only synthetic data and never reach the backend import or
export endpoints in this browser check. This validates the client workflow, not
real archive parsing, config application or server-side export contents. Backend
and header permission checks are unchanged. Remaining AntD consumers, shared
shell, React 18 and Vite are separate stages.
