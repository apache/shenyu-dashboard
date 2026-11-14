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

# Semi system forms: Namespace, Registry and User

Migrate three complete dialogs to Semi controls and Semi's native Form/withField
engine. A bounded prop bridge keeps these existing business classes' callback
validation and imperative value methods. It does not import rc-form or AntD.
A context owner injects the form methods; the actual native form remains where the
caller renders Form, so the dialog is not wrapped in an extra hidden/nested form.

The bridge covers the observed initialValue/rules/valuePropName, callback validation,
partial setFieldsValue, get/reset and record identity behavior. Native fields own
state/errors and registration. Before setValues, merge the patch into current values:
Semi's default setValues still clears registered fields omitted from its argument.
Keep arrays as replacements, preserve explicit undefined/empty/false/zero values,
and omit fields unmounted by the caller. Validation callbacks are suppressed after
unmount. Record ID changes create a fresh owner and reset the draft.

Input event adapters preserve existing event.target.value callers; Select/Switch
adapters map only the used multi-selection/checked APIs. Modal bounds and footer
accessible labels are explicit. Passwords remain masked and never initialized
from stored secrets. An untouched edit password is omitted. Registry/namespace
IDs retain their disabled state; disabled user state and role IDs are preserved.

Ten behavior tests passed on the original AntD implementation before edits.
Fifteen focused tests pass on the new engine and actual dialogs. Full validation:
69 suites /482 tests, lint and production build pass with inherited warnings.
Real local H2 Admin confirms namespace creation/readback/isolation and user creation
through the Semi UI with no page errors. User editing omits the empty password,
and the original credential still authenticates afterward. Initial real login
remains functional.
Browser responsive checks verify a bounded dialog and no nested form elements.
The new jsdom media/resize observer setup enables component tests; geometry is
validated in Chromium instead of claimed from those stubs.

This bridge is intentionally limited to the three migrated forms. Virtual fields,
forms without a native form host, Upload semantics and larger dynamic plugin forms
need dedicated acceptance cases before migration. Other AntD consumers and React18
peer cleanup remain later slices. No production deployment or gateway test is
included.
