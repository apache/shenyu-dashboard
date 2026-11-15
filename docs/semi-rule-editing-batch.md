# Rule editing migration

The common Rule dialog, CommonRuleHandle, five custom plugin handlers (request,
generalContext, modifyResponse, paramMapping and hystrix), and both source-copy
dialogs now use Semi controls. This removes nine production AntD imports; 27
production JavaScript files still import AntD directly. Selector/Discovery form
ownership and the common selector/rule list remain separate follow-up work.

The form owner and all nested handlers migrate together. Request/general-context
tabs mount their fields eagerly and retain them across tab changes, so saving an
unvisited tab does not lose values. Request rows use field identities as React
keys. Response/parameter tables retain explicit row IDs and existing JSON shapes.
Native date/time pickers explicitly request string-first callbacks and preserve
the existing local `YYYY-MM-DD HH:mm:ss` condition format.

Bounded fixes:

- Request serialization no longer drops numeric zero or boolean false values.
- The rule editor waits for handle metadata before mounting handler forms or
  allowing submission. This prevents custom-rule initial-render crashes and
  avoids registering the JSON mode before structured metadata arrives.
- Selector copying clears the old selection/tree on source namespace changes and
  ignores obsolete list responses. Both copy dialogs ignore detail responses
  after cancel, unmount, selection or source namespace changes, prevent empty
  submission and recover from failed detail requests.
- Selector detail calls receive the selected source context. The existing service
  still addresses details by globally unique ID and does not transmit namespace
  in that URL; this is not a backend authorization or isolation change.
- Copy trees expand asynchronously loaded data, keep parent nodes unselectable
  and preserve selectable leaves. Selector copying warns about truncated or
  missing-parent source data, matching the existing rule-copy behavior.

Validation:

- Before migration: 31 existing common-plugin cases and five new rendered handler
  serialization contracts pass. Five selector-copy regressions fail before their
  fixes. Custom-rule startup and numeric zero/false regressions also reproduce
  before fixes. A migration-stage time-edit regression caught Date-first callback
  serialization and passes with the explicit callback setting.
- Final full suite: 114 suites / 769 tests pass. Lint, production build and
  whitespace checks pass; existing unrelated tooling/style warnings remain.
- Isolated Chromium exercises the production bundle served by local H2 Admin:
  six rule editors save, request headers are edited, protocol tabs are switched,
  date/time inputs are edited without changing the condition format,
  source-rule copying fills the destination editor, and IDs, namespace and false
  flags remain intact. Request/response/parameter zero and false values survive.
  No browser page errors are observed. The screenshot is taken after tab and
  toast transitions settle.
- All plugin/selector/rule data and rule writes are intercepted synthetic
  fixtures. Local session/base permission responses are real; added UI grants
  are fixtures. Local Admin lacks `hystrixIsolationModeEnums`; that enum is also
  supplied by the fixture. Hystrix UI compatibility is verified, not support by
  the currently running backend. No gateway configuration or database is written.

No dependency, backend, load-test or build-tool change is included. React 18,
Vite, Discovery, common lists, shell/theme/mobile and remaining AntD consumers
are not complete. Existing Hystrix numeric/string coercions are retained.
