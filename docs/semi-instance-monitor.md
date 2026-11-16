# Semi instance monitoring

Instance monitoring now uses Semi Table with native resizing, buttons, cards,
tags and the detail popover, plus shared input/select controls. The table follows
the application locale and uses one pagination callback: page-size changes reset
to page one and retain IP/type/namespace filters. Existing immediate filter
queries remain; the query form also supports Enter submission.

The two chart containers no longer have fixed 800px widths. They fit their cards,
stack below 1000px viewport width and notify ECharts through ResizeObserver when
container size changes. The window resize listener remains as a fallback.
Unmount disconnects the observer, removes the listener and disposes both charts.
Native table resizing replaces the custom header adapter and its local width
mutation code.

A reproduced regression showed that changing namespace props only refreshed the
list. It now requests both list and analysis, resetting paging and selection.
This change does not add response-order guards to the model or change chart data
semantics.

Validation:

- 19 baseline tests passed before migration. The new namespace-refresh regression
  failed before the fix; 22 focused tests now pass, including pagination request
  count, container observation and unmount cleanup.
- Full suite: 89 suites / 615 tests, lint and production build pass with existing
  unrelated warnings.
- Real local Java/H2 Admin returned HTTP 200 for list and analysis; its instance
  list is empty. Real chart canvas widths follow their containers (521px side by
  side, 860px stacked), and navigation away followed by resize produces no error.
- Separately, intercepted browser responses provide 30 explicitly synthetic rows
  and chart data. Native column resizing grows about 136px to 195px and survives
  pagination. One page-size query retains namespace; JSON detail, selection
  without fetching, IP/type filtering and page reset are checked.
- No backend records are created, no remote load tests run, and no browser page
  errors occur. Synthetic-data checks are not live gateway registration tests.

The global shell still has a minimum width; this stage fixes the chart containers,
not all mobile layout. Remaining AntD consumers, React 18 and Vite are separate
stages.
