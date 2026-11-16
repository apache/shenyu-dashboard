# Semi MCP management batch

This batch migrates the MCP management page, JSON tool editor, client-config
viewer, Swagger import form and tools-editor loader. Five production AntD imports
are removed, leaving 36 direct production JavaScript importers. The existing
native tools editor stays intact; the shared selector editor remains part of the
future common-plugin batch.

Server/tool tables use one pagination callback each. Native action buttons and
status controls preserve permission keys and do not activate the surrounding
server row. Filter toolbars have their own wrapping layout rather than the old
fixed-height header. JSON editing uses native radio buttons and tab item keys;
identity, zero/false parameter values, request config and validation are retained.
Config copy keeps SSE/Streamable URL generation and reports clipboard failure.

The accompanying behavior fixes are bounded:

- Selector search starts at page one. Selector refreshes carry the tool page size
  and reset the child pager/search to match the model's first-page response.
- Shared reload effects retain optional name filters and dependent tool page size.
  JSON save relies on one model-owned reload instead of issuing a second query.
- Successful rule deletion notifies its caller; deleting the last tool on a later
  page updates the displayed pager only after success.
- Changing servers clears old tool selections. JSON-editor responses are ignored
  after cancellation, unmount or a changed selector/namespace context. This does
  not claim comprehensive request-order guards for the shared common model.

Browser validation uncovered a separate prerequisite: Webpack 3 treated the JSON
viewer's .mjs import entry as an inline asset, causing a DOM InvalidCharacterError
when a real config/preview opened. The existing webpack hook now resolves that
package's supported CommonJS export through Node, preserving other aliases and
static chunk paths. No package version or dependency is added. Remove this legacy
resolver workaround when the future builder migration validates ESM resolution.

Validation:

- 52 baseline cases pass before migration. Six pagination/reload regressions fail
  before their fixes. Final targeted coverage totals 68 passing cases.
- A real Webpack compilation/render test reproduces the inline-asset error with
  the old hook and renders zero/false JSON values with the fix. It uses the existing
  JS transpilation and asset-loader behavior rather than mocking the viewer.
- All 110 suites / 746 tests, lint, production build and whitespace checks pass.
  Existing unrelated warnings remain. Production assets were browser-tested.
- Synthetic browser fixtures verify both page-size controls, dependent pagination,
  checkbox/status isolation, tools-editor opening, JSON text/preview switching,
  format/compress/copy, one JSON-save refresh, retained filters and last-page delete.
- SSE/Streamable config URLs/transports and copy payloads are checked without
  recording their header values. Swagger success preserves query context; failure
  retains the form. Both the JSON viewer and final toolbar layout render without
  page errors. A local Admin session expiry was resolved through normal login.

All selector/tool/Swagger writes and extra UI permissions in the browser test are
controlled fixtures. No actual tool endpoint, Swagger source or MCP gateway is
called. Existing client-config example headers are retained and authentication/
connectivity is not validated. No prior bundle-size claim is remeasured here.
Wide tables still scroll; remaining common-plugin/Discovery, shell/mobile/theme,
React 18 and Vite work requires later batches.
