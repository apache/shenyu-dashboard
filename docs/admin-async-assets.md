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

# Anonymous async assets in Admin

Real H2 Admin integration found that root-level async bundles were rejected with
HTTP401, including the login route itself. Admin's existing anonymous resources
include `/static/**` and entry files; script requests do not carry the session
header used by application API requests.

The Roadhog override emits asynchronous JavaScript below `static/`. Keep relative
public paths, content hashes, chunk names and entry/CSS behavior. Existing binary
assets already use `static/`. No Admin whitelist or API authorization change is
needed. The future build tool must retain the same `/static/` asset boundary.

With the actual Admin process, all36 async files return200 anonymously while
`/meta-data/queryList` without a token still returns401. The source dashboard
login page opens and a genuine login reaches the Home page without page errors.
The existing459 tests and production build pass. This is the first real-Admin
baseline; broader namespace/permission/CRUD validation continues separately.

This small `webpack.config.js` override uses Roadhog's documented customization
surface and its installed output configuration. Remove it when Roadhog is replaced;
do not carry an old Webpack configuration into the new builder. Publish the full
hashed asset set with the matching index, retaining previous assets for cached tabs.
