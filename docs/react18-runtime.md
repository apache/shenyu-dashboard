# React 18 runtime migration

React and ReactDOM are pinned to 18.3.1. The application entry now owns a
`createRoot` root and returns `root.unmount` cleanup instead of using the legacy
render API. Testing Library React moves to 16.3.0 with its DOM peer 10.4.1, so
component tests also exercise concurrent roots and automatic batching.

This follows the [official React 18 upgrade guide](https://react.dev/blog/2022/03/08/react-18-upgrade-guide).
No legacyRoot option, force/legacy-peer-deps install flag, application-wide
flushSync workaround or console-warning suppression is introduced.

Dependency resolution required rebuilding the old root React/Testing Library
peer placements in the lockfile. The unused `umi-test` bundled with Roadhog still
requires React 16/Enzyme: npm now installs that toolchain in its own nested subtree.
The application and production dependency tree resolve React 18; `npm test` runs
our existing Jest 29 script, not Roadhog's test command. Clean `npm ci` and the
complete peer dependency tree validate without invalid peers. Vite migration
will remove the obsolete build/test toolchain separately. No package override or
peer relaxation is added.

The parent AntD-removal PR exposed a separate npm-version lock difference: npm
12 omitted optional Jest/Babel peer entries required by CI's npm 10. Both branches
were regenerated with npm 10.9.4. The parent PR receives its own repair; this
branch also includes those entries. Clean npm 10 installs were verified with
lifecycle scripts skipped, and the complete tests/build rerun afterward. Existing
local npm 12 policy similarly blocks unapproved dependency lifecycle scripts.

The only test-environment API addition is Node's TextEncoder/TextDecoder in
jsdom. React 18's browser server-renderer entry requires it for the existing
static SVG contract tests. This is a test setup change, not a browser polyfill.

Validation:

- 123 suites / 819 tests pass under the upgraded Testing Library, including all
  existing form, dynamic-field, permission, route and icon contracts.
- A new runtime test proves Promise updates commit once and root unmount cleans
  effects/DOM. It fails against the previous legacy render entry (two commits)
  and passes with createRoot. No rendered-value assertions are weakened.
- Clean install, dependency validation, lint, production build and whitespace
  checks pass. Package changes are limited to React, its scheduler/types and the
  testing-library dependency graph; the old dev-only peer subtree is relocated.
- Four production-browser workflows pass: login/header/navigation/namespace/
  password fixtures; data permissions/Scale; six rule editors; and Discovery.
  They cover dynamic tabs, date/time strings, zero/false values, copy dialogs,
  delayed namespace responses, paging, row editing and mutation-refresh counts.
  All configuration-changing writes are intercepted synthetic fixtures and no
  browser page errors occur.
- Genuine local H2 Admin login also returns code 200 and reaches the main layout
  without page errors. Credentials/session material stays outside Git. No real
  password, permission, scaling, discovery or gateway changes or pressure tests.

Application-wide StrictMode is not enabled by this change. The existing lifecycle
patterns and third-party components need a separate StrictMode audit. React 18.3
reports deprecation warnings from Semi's findDOMNode-based resize observer and
memo-component defaultProps, along with existing act/validation warnings in tests.
Those warnings are retained, not treated as React 19 readiness. Semi versions,
application models/services and Roadhog/Webpack configuration are unchanged.
No QPS, render-speed or bundle-size gain is claimed. Vite remains the next stage.
