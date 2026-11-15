# Semi authentication and API key management batch

This batch migrates AppAuth list/search/create/edit/path-table controls, the
related-metadata loader, and AI Proxy API key management. Six production files
stop importing AntD; 41 production JavaScript imports remain, down from 47.
The existing metadata-transfer editor and server permission rules are unchanged.

AppAuth uses native table resizing and one pagination callback. Selection does
not fetch. Namespace changes clear selection/page/dialog state and refresh the
new query; late create/edit callbacks and inactive-namespace list responses are
ignored. Filters and page size remain attached to mutation reloads.

Editable paths use stable client row keys rather than page-relative row indexes.
Submission strips those keys while retaining server path IDs and enabled flags.
Editing no longer mutates caller-owned path/parameter objects. Grouped metadata
and typed custom application names remain supported, including closed path
access. Existing resource-transfer no-op and disabled-path protections remain.

API Key search submits the current trimmed input, and Refresh explicitly clears
its filter. Scope changes reset paging/selection/dialogs; request identities
prevent obsolete selector responses from replacing current rows. Mutations use
the latest refresh callback and ignore obsolete scopes. Create resets the visible
page to one, does not close on an application error, and displays/copies the
returned key through a declarative modal. Edit sends only supported fields;
real-key presets remain display-only. Existing visible key-management values are
not newly masked or sent in additional payloads.

Validation:

- Forty-four pre-migration baseline cases pass. Three API-key search/scope
  regressions fail before their fixes; an inactive AppAuth namespace-response
  regression also fails before its guard.
- Fifty-seven focused cases cover the two areas, including original resource
  transfer/loader tests, path editing/deletion on later pages, immutable inputs,
  false flags, custom application names, API-key copy and failed creation.
- All 106 suites / 721 tests, lint, production build and diff checks pass after
  final layout adjustments. Existing unrelated lint warnings remain.
- Browser AppAuth fixtures verify six mutations with one filtered/namespaced
  refresh each, later-page path IDs/disabled status, readonly credential fields,
  grouped creation, exact deletion and no request for unchanged resource grants.
- Browser API-key fixtures verify submitted/cleared filters, one size-change
  request, edit/create payloads, page-one creation, copy, batch enable/delete and
  a failed create retaining its form. Screenshots were inspected; no page errors.

All auth/key records, selector credentials and clipboard content in these checks
are explicitly synthetic. Browser responses and writes are intercepted; the API
key route also uses a synthetic UI-permission fixture to expose the test selector.
No real credential or authorization is created, changed, deleted or copied, and
these checks do not prove backend authorization or real upstream key behavior.
Wide auth tables retain horizontal scrolling. Remaining plugin areas, shared
shell/mobile/theme, React 18 and Vite require later batches.
