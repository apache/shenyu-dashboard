# Vite build migration

Vite 7.3.8 and plugin-react 5.2.0 replace Roadhog/Webpack 3. The application stays
on React 18.3.1 and Semi 2.87.0; this batch changes build/module plumbing rather
than gateway behavior. Node >=22.12 is required (24 recommended).

The ESM entry preserves explicit model registration before store startup and root
rendering. Model modules are imported statically; their registration remains
synchronous and conditional. Menu labels are resolved when menus are requested,
after locale initialization, rather than relying on CommonJS require order. API
base lookup tolerates an absent httpPath element during module evaluation and
retains the existing relative fallback. The existing EventEmitter and UUID v4
packages are now explicit runtime dependencies instead of accidental build-tool
transitives; their APIs are unchanged.

Babel handles existing legacy decorators/class fields and JSX in .js files before
Vite import analysis. Bound Less imports are renamed to .module.less, while the
entry stylesheet remains ordinary global Less. Its old CSS-Modules :global
wrappers are removed; this is important for global resize handles and page layout.
The component styles themselves retain their existing rules. Semi base.css is
explicitly imported by the entry: screenshot review caught theme variables being
loaded only by a later editor chunk. Build and browser checks now require those
tokens before any lazy route renders. The native ESM JSON
viewer no longer needs Webpack's supported-CJS alias. Its compiler regression now
builds the actual ESM entry with Vite and renders the result without mocking it.

Production deployment retains hash routing, relative asset URLs, static/ for all
entry/lazy assets, and Admin's `th:text="${domain}"` httpPath binding. The build
runs scripts/verify-dist.mjs to verify HTML references, every manifest entry and
its imports, required files, lazy entries and the static path boundary. The
manifest lives at dist/.vite/manifest.json. A separate browser test serves the
real artifact at /console/ and checks lazy login assets and relative API requests.

Development ignores generated coverage reports to avoid reload storms during tests.
It uses port8000 and an API proxy to localhost:9095, configurable through
SHENYU_ADMIN_URL. Frontend modules/assets are excluded from proxying. NO_PROXY=true
(or start:no-proxy) disables the proxy. Preview is static and has no API proxy.
The obsolete .roadhogrc.mock.js referenced a missing mock directory; it is removed
with roadhog-api-doc/mockjs. This migration does not promise an offline mock server.
The site command now builds/publishes the dashboard with gh-pages when explicitly
invoked (not run during validation). Analyze builds with source maps.

Jest29 remains independent of Vite, using explicit Babel env/react/decorator/class
field transforms. The maintained Babel ESLint parser replaces babel-eslint's old
implicit escope dependency. Its class-methods-use-this setting excludes bound
class-field handlers, preserving the previous parser's effective behavior;
prototype methods remain checked. One harmless JSX literal is formatter-corrected.

Validation:

- A clean npm10.9.4 install succeeds with lifecycle scripts skipped; lockfile
  entries decrease from3,739 to2,179. Roadhog, Webpack and umi-test are absent;
  no React16 peer subtree remains. Existing direct runtime versions are unchanged.
- 124 suites / 820 tests pass, lint and production build pass. The new menu test
  reproduces empty import-time labels before the fix. The JSON viewer test uses
  the replacement compiler and retains zero/false rendering assertions.
- Production artifact validation checks89 manifest entries and eager Semi theme tokens. Source-map/chunk-size
  warnings remain visible; no build-speed, bundle-size or QPS percentage is claimed.
- Real local Admin login passes both through the Vite dev proxy and from the
  production artifact served by H2 Admin (code200/main rendered/no page errors).
- Production fixtures cover login/navigation/namespace/password, MCP JSON viewer
  and Swagger/config dialogs, data permissions/Scale, six rule editors, Discovery,
  AppAuth and API keys. Config-changing requests are intercepted; no actual
  password, permission, scaling or gateway changes are performed.
- /console/ static deployment and no-proxy mode are independently verified.

No StrictMode enablement, React19 migration, legacy lifecycle cleanup or full
TypeScript type audit is included. The build transpiles the existing TypeScript
utility; tests remain JS. Vite's chunk graph differs from Webpack and currently
warns about large editor/chart chunks. Historical benchmark and earlier migration
documents describe their original build versions, not current guarantees.
