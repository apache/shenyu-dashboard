# Semi home overview

The home overview uses Semi steps, cards, timeline, banners, popovers and buttons
with the shared declarative modal. Plugin navigation and event-detail actions are
keyboard accessible. Card columns stack below 1000px, popovers have bounded size,
and detail text wraps within the viewport. Home styles use Semi tokens rather
than importing the AntD theme. The hidden Monitor column containing hardcoded
example statistics is removed; no live metric source is replaced.

Plugin snapshots use the current namespace prop, refresh on changes, and reject
late responses/errors from older requests. Unmount guards replace assignment to
setState. Event logs remain a global feed as in the existing API. Independent
request-failure banners distinguish failed requests from valid empty lists.
Malformed plugin configuration JSON remains readable as text instead of crashing
the overview.

Validation:

- Three original overview/navigation cases pass before migration. The namespace
  refresh regression fails before the fix and passes afterward.
- Nine focused cases cover navigation, details, malformed config, request errors,
  stale namespace responses/errors, and unmount. All 95 suites / 654 tests pass;
  final-source focused checks, lint and production build also pass. Existing
  unrelated lint warnings remain.
- Real local Java/H2 Admin snapshot/log APIs return code 200 with 7 active plugins
  and 12 events. No backend data is written.
- Separately intercepted synthetic responses verify keyboard log-detail opening,
  absolute divide navigation, real namespace-picker refresh, malformed JSON text,
  failure banners and stacked cards. A 390px viewport produces a 358px modal.
  No browser page errors. Synthetic event contents do not expose real log details.

Shared navigation still has a minimum-width/long-namespace wrapping limitation;
this is not complete mobile support. Remaining AntD consumers, React 18/Vite and
shared-shell work are separate stages.
