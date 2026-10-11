/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { checkButtonAuth } from "./AuthButton";

it("returns only the exact permission granted by the current namespace", () => {
  const edit = { perms: "rule:edit", icon: "edit" };
  expect(checkButtonAuth("rule:edit", { button: [edit] })).toBe(edit);
  expect(checkButtonAuth("rule", { button: [edit] })).toBeNull();
  expect(checkButtonAuth("rule:delete", { button: [edit] })).toBeNull();
});

it.each([undefined, {}, { button: [] }])(
  "denies access with missing permissions %p",
  (permissions) => {
    expect(checkButtonAuth("rule:edit", permissions)).toBe(false);
  },
);

it("does not reuse a grant after namespace permissions change", () => {
  const first = { button: [{ perms: "rule:edit" }] };
  const second = { button: [{ perms: "rule:read" }] };
  expect(checkButtonAuth("rule:edit", first)).toEqual(first.button[0]);
  expect(checkButtonAuth("rule:edit", second)).toBeNull();
  expect(checkButtonAuth("rule:read", second)).toEqual(second.button[0]);
});

it.each(["toString", "constructor", "perms"])(
  "does not treat an object property %s as a permission",
  (perms) => {
    const permissions = { button: [{ perms: "rule:edit" }] };
    checkButtonAuth("rule:edit", permissions);
    expect(checkButtonAuth(perms, permissions)).toBeNull();
  },
);
