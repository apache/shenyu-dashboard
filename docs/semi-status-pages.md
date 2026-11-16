# Semi status pages and pending authorization views

Shared exception/result components, legacy result examples, the error-trigger
page and PromiseRender now use Semi controls/spinners or the existing first-party
SVG renderer. Result icon labels, supplied titles/descriptions/actions, exception
fallbacks, home links and the four error codes are preserved. Exception/result
styles use Semi colors with the existing 480/576/1200px responsive breakpoints.
The example result actions remain illustrative, not newly wired business flows.

PromiseRender now clears the previous component when its promise changes and
accepts only the current request's settlement. Older grants cannot replace newer
denials; older rejections cannot replace newer grants. Unmount ignores pending
completions. The pending view exposes an accessible status. This is presentation
synchronization; permission rules and backend authorization are unchanged.

Validation:

- Eleven rendered behavior contracts pass before migration. The original three
  trigger-loading checks are retained, independently rerun against the original
  trigger source alongside the dispatch check, then adapted to Semi's spinner.
- Two promise-switch regressions fail before the fix. Forty-two focused tests
  pass after it, including the existing permission-decision tests.
- All 98 suites / 668 tests, lint and production build pass, with existing
  unrelated warnings.
- Headless Chrome against the local Admin verifies 403/404/500 content and
  keyboard Back to Home. A controlled intercepted /api/500 response verifies the
  trigger's initial idle state, pending spinner and subsequent 500 route. No
  backend failures are induced and no data is written; no browser page errors.

Legacy result examples are unit-rendered because they are not registered routes.
Exception illustrations retain their existing external URLs, so image loading
still depends on that host. Shared-shell/mobile completion, remaining AntD
consumers and React 18/Vite remain separate stages.
