# Login and shell migration

The last 15 production JavaScript consumers of AntD now use Semi or existing SVG
icons: login composition, login/user layouts, main layout, navigation, global
header, breadcrumbs, route loading/auth spinners, the top-level locale/backtop
and permission-button adapters. Production JS has no direct `antd` imports.
AntD remains installed for legacy Less theme references and build configuration;
this is not removal of the package or completion of React 18/Vite migration.

Login composition now uses modern React Context rather than legacy child context.
The form wrapper explicitly exposes its static inputs, submit, captcha and Tab
API. Field registration is cleaned up on unmount; only common/current-tab fields
are validated and submitted, while other tab values remain intact. Existing AES
secret initialization, login payload and verification-code checks are unchanged.
The form has a local light panel for contrast against its existing background;
verification input and refresh control share a flex row.

The header uses click-triggered native dropdowns and a real shared Semi password
form. Required/password-strength/confirmation checks remain; successful password
update still resets the form and invokes logout. English locale callbacks now use
canonical `en-US`. Namespace changes retain the existing plugin and permission
refresh sequence. Import/export entries remain permission gated. The original
translation artwork is rendered directly rather than relying on an absent icon
alias. No import/export or password write is performed against a real backend in
browser fixture checks.

The sidebar uses native Nav with explicit route item keys and linked wrappers.
Links preserve exact route metadata and keyboard navigation; late menu data opens
the active route's parents. Localized labels no longer mutate caller-owned menu
objects. Compact navigation replaces the prior alternate menu-mode switch and is
also available from the header; expansion retains the resized width. Sidebar
width remains constrained to 200–500px, with an 80px compact mode.

Main layout now implements the existing collapse callback, removes its fixed
1200px outer minimum and uses a wrapping header. A 900px viewport check verifies
header controls remain onscreen with a long namespace label and compact sidebar.
This does not claim all application pages or phone layouts are fully responsive.
Breadcrumbs use a shared modern provider and derive their contents from the latest
route, rather than retaining a stale initial trail. Route-based breadcrumb paths
normalize duplicate separators so a root route cannot produce a protocol-relative
link such as `//users`. Route authorization decisions
and model effects are unchanged. Native permission-button child icons and render
functions preserve grants, fallback and revocation behavior.

Validation:

- 92 existing related tests, two new login contracts and two password/header
  contracts pass against their original implementations (the login harness mocks
  an existing TypeScript captcha utility). A late-menu expansion regression fails
  before the state derivation fix.
- All 122 suites / 818 tests pass, plus lint, production build and whitespace
  checks. Existing unrelated style/tool/test warnings remain. No new dependency.
- Tests exercise conditional captcha, active-tab values, frozen menu data, route
  selection, breadcrumbs, canonical locale, exact password-change payload and
  success-only logout, permission icons and denied/revoked actions.
- A genuine local H2 Admin login succeeds (code 200), reaches the main layout and
  reports no browser errors. Credentials/session files remain private and outside
  Git. The local server's existing no-client-secret configuration is supported.
- Separate isolated Chromium fixtures supply known synthetic AES key/IV values
  and decrypt the intercepted login request to verify the existing encryption
  branch. A failed login enables captcha; incorrect captcha prevents another
  request. The test covers collapse/restore, resize, keyboard menu navigation,
  both languages, import-dialog opening/cancel, namespace refresh and revoked
  header actions, 403 routing, invalid/mismatched password rejection and intercepted
  successful password update followed by cleared-session logout.
- The previous data-permissions/Scale browser workflow also passes with the new
  shell, including delayed namespace replies and read-only controls.

Synthetic credentials and password updates are intercepted; no real password,
permission, registry, scaling or gateway configuration is changed. Actual local
Admin login and ordinary reads are real. No Linux pressure test is run. Remaining
work includes six legacy Less theme imports, AntD package/build cleanup, React
peer/runtime validation and Vite migration; none is implied complete here.
