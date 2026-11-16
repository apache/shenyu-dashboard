<!--
Licensed to the Apache Software Foundation (ASF) under one or more
contributor license agreements. See the NOTICE file distributed with
this work for additional information regarding copyright ownership.
The ASF licenses this file to You under the Apache License, Version 2.0
(the "License"); you may not use this file except in compliance with
the License. You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

# Runtime core and routing bridge

Separate the application from Dva's React renderer, React-Redux5 and Router4
bindings while retaining the existing21 business models. The supported bridge is
React16.14, dva-core2.0.4, Redux4.2.1, React-Redux8.1.3 and the existing Router6 /
history5 packages. The root registers models, starts the core store, installs the
Provider and renders through one small renderer boundary. Request dispatch remains
injected before startup.

The router boundary uses Router6 and preserves the class pages' path/params,
location/history, nested absolute routes, redirects, links and withRouter props.
Model push/replace actions use one history instance through middleware. The global
subscription now reads history5's location update shape. No business reducer/effect
or API DTO rewrite is included.

The former dva-loading package required the old Dva peer. Its small state/filter
contract is retained in the existing local loading plugin, including finally
cleanup. Browser fetch no longer depends on dva/fetch; a local forwarding module
retains a browser fetch polyfill. Document-title and captcha components no longer
require React16-only packages; the existing JSON editing API uses the maintained
Microlink fork. The captcha initializes on mount and has a keyboard-operable refresh
button while preserving its existing client-side role. Dva's old HMR plugin and
redbox dependency are removed.

## Why React16 is retained here

A React18.3 candidate passed focused runtime tests but failed dependency-tree
validation: Ant Design3's internal icons-react, react-slick and react-lazy-load
still restrict their React peers. The candidate is not adopted. Keep a supported
React16 bridge while migrating the remaining AntD consumers, then enable the
prepared React18 renderer and retest a compatible dependency graph. No force or
legacy-peer-deps flags are used. This stage does not claim React18/19 completion.

React's official upgrade guide recommends18.3 before19:
https://react.dev/blog/2024/04/25/react-19-upgrade-guide
Version/peer evidence comes from the published npm package manifests for dva,
dva-core, react-redux, the affected AntD dependencies and their replacements.

## Validation

The old router/loading implementation passed12 focused contracts before edits.
The Router6 boundary then passed the same navigation cases before changing the
runtime packages. Final full coverage: **67 suites / 473 tests pass**, including
model effect/reducer/subscription integration, middleware navigation, unmodel
cleanup, loading cancellation/filtering, bootstrap ordering, current dispatch,
captcha and title behavior. Lint and production build pass with inherited warnings.
Clean npm10 installation succeeds, and the React/Redux/core peer audit passes.

Real disposable H2 Admin verifies login and Home, Metadata UI create and DB
readback, authenticated Metadata/AppAuth/plugin/role deep links, browser Back and
real invalid-token401/logout. A Router6 timing difference initially let a child403
redirect race the layout's login redirect. The root auth boundary now redirects
without mounting protected children when no token exists; its focused regression
and the real anonymous deep-link check pass.

All of this is against a local disposable Admin. Broader namespace/role permissions
and remaining UI migrations continue under the completion plan; no production
backend deployment, gateway load test or merge is included.
