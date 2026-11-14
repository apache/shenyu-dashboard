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

# Request/store boundary (stage 3d)

The request utility imported the application entry just to dispatch session-expiry
actions. Services and models import that utility, so this also created an import
cycle through the bootstrap and made isolated request tests initialize the app.

The bootstrap now installs a dispatch function before `app.start()`. The function
reads the live app store when an action is sent, after Dva creates its store.
`request.js` no longer imports the entry. HTTP and application-code 401 responses
still dispatch `login/logout` followed by `global/resetPermission` and reject with
the original error. Download handling continues to use the same unauthorized hook.
A standalone request import has no implicit application startup; hosts install
dispatch before starting their application.

The 44 existing request/download/service contracts passed before edits. Final
coverage: 63 suites / 459 tests passed; lint and production build passed with
inherited warnings. New checks reject accidental bootstrap imports, verify dispatch
installation before startup and use the current dispatcher for an in-flight 401.

A production-asset headless browser check with local fixtures verified that a 401
after Metadata loads clears token/user/namespace and redirects to Login without
page errors. Real H2 Admin API login also succeeded. Its browser integration found
an independent inherited deployment issue: root-level async JS receives 401 because
Admin anonymously serves `/static/**` and entry resources, not arbitrary root
chunks. Resource output placement is handled in the next build slice. This stage
does not claim full real Admin integration or any latency/throughput improvement.
