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

import { checkMenuAuth, resetAuthMenuCache } from "./AuthRoute";

jest.mock("./IntlUtils", () => ({ getIntlContent: (key) => key }));

beforeEach(() => resetAuthMenuCache());
afterEach(() => resetAuthMenuCache());

it.each(["/", "/home", "/exception/403"])(
  "allows the public route %s without permissions",
  (path) => {
    expect(checkMenuAuth(path, {})).toBe(path);
  },
);

it("denies protected routes when permissions are missing or empty", () => {
  expect(checkMenuAuth("/system/user", undefined)).toBe(false);
  expect(checkMenuAuth("/system/user", { menu: [] })).toBe(false);
});

it("finds nested menu permissions without granting adjacent routes", () => {
  const permissions = {
    menu: [
      { url: "/system", children: [{ url: "/system/user", children: [] }] },
    ],
  };
  expect(checkMenuAuth("/system/user", permissions)).toBe("/system/user");
  expect(checkMenuAuth("/system/user-extra", permissions)).toBe(false);
});

it("matches a plugin instance against its normalized permission route", () => {
  const permissions = { menu: [{ url: "/plug/divide" }] };
  expect(checkMenuAuth("/plug/42/divide", permissions)).toBe("/plug/42/divide");
  expect(checkMenuAuth("/plug/42/dubbo", permissions)).toBe(false);
});

it("uses the new namespace's permissions even when a previous menu was cached", () => {
  const first = { menu: [{ url: "/system/user" }] };
  const second = { menu: [{ url: "/system/role" }] };
  expect(checkMenuAuth("/system/user", first)).toBe("/system/user");
  expect(checkMenuAuth("/system/user", second)).toBe(false);
  expect(checkMenuAuth("/system/role", second)).toBe("/system/role");
});
