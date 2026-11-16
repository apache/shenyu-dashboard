# Remove the AntD component dependency

After the component migrations, this batch removes `antd` and the unused direct
`babel-plugin-import` dependency, its Roadhog import transform, and the obsolete
AntD theme override module. The six remaining Less imports no longer load AntD's
default theme. Their used values are explicit local colors, sizes and breakpoints,
matching the previous resolved values rather than introducing a visual redesign.

Before removing dead selectors, each of the six stylesheets was compiled with
and without the imported theme. All generated CSS rules matched exactly; only
imported stylelint comments disappeared. Unreachable AntD selectors were then
removed, including the no-op plugin `rootFormItem` class and its callers. PageHeader
button/tab selectors now address the already migrated Semi components. Login's
public type declaration and API notes no longer refer to AntD controls.

The lockfile loses 97 package entries (3,853 to 3,756), without adding packages or
changing any retained package version/integrity value. Existing mirror tarball
URLs are normalized to the official npm registry: a clean install initially
failed under npm 12's remote-download restriction on mirror URLs. The official
URLs retain the existing integrity checks and allow a clean `npm ci` to complete.
This URL normalization accounts for much of the lockfile diff. No global npm
configuration or download restrictions are changed.

`@ant-design/icons@2.1.1` remains deliberately: it supplies static SVG artwork for
persisted resource icon names. It is not the AntD React component library. Its
existing icon coverage and permission-icon tests remain part of the full suite.
Historical Markdown demo snippets may still mention AntD; they are not runtime
imports and their wholesale rewrite is outside this dependency cleanup.

Validation:

- Clean `npm ci` completes; `npm ls antd --all` reports an empty tree and the
  `node_modules/antd` directory is absent. Runtime JS/TS/Less, manifest, lockfile
  and build configuration contain no AntD dependency/import references.
- 122 suites / 818 tests pass after the clean install; lint, production build
  and whitespace checks pass. Existing unrelated style/tooling warnings remain.
  The legacy build's TypeScript coverage is unchanged, not a new full type audit.
- Isolated browser regressions exercise login/AES/captcha, header/navigation and
  namespace permission changes, permission grants/Scale operations, and six rule
  editors with cross-tab, date/time, zero/false and copying behavior. Requests that
  would mutate passwords, permissions, scaling or gateway configuration are
  intercepted fixtures; no live configuration or Linux pressure test is performed.

React remains 16.14 and the build remains Roadhog/Webpack 3. Removing AntD clears
one upgrade dependency; it does not establish React 18 or Vite compatibility, nor
quantify a runtime performance or bundle-size gain.
