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

import { checkMenuAuth, getAuthMenus, resetAuthMenuCache } from "./AuthRoute";

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

const sidebarPermissions = {
  menu: [
    { url: "/plug", meta: {}, children: [{ url: "/plug/divide", meta: {} }] },
    {
      url: "/system",
      meta: {},
      children: [
        { url: "/system/role", meta: {} },
        { url: "/system/manage", meta: {} },
      ],
    },
  ],
};

it("clears cached sidebar entries immediately when permissions are cleared", () => {
  const plugins = [];
  const tree = [];
  expect(
    getAuthMenus(plugins, tree, sidebarPermissions, true).length,
  ).toBeGreaterThan(0);
  expect(getAuthMenus(plugins, tree, { menu: [], button: [] }, true)).toEqual(
    [],
  );
});

it("rebuilds cached plugin entries when plugins finish loading or change namespace", () => {
  const tree = [];
  getAuthMenus([], tree, sidebarPermissions, true);
  const first = getAuthMenus(
    [{ name: "divide", role: "0", id: "plugin-A" }],
    tree,
    sidebarPermissions,
    true,
  );
  expect(first[0].children[0].children[0].id).toBe("plugin-A");
  const second = getAuthMenus(
    [{ name: "divide", role: "0", id: "plugin-B" }],
    tree,
    sidebarPermissions,
    true,
  );
  expect(second[0].children[0].children[0].id).toBe("plugin-B");
});

it("rebuilds cached sidebar entries when the resource menu tree changes", () => {
  const plugins = [];
  function treeFor(child) {
    return [
      {
        name: "system",
        url: "/system",
        meta: { title: "System" },
        children: [{ url: `/system/${child}`, meta: { title: child } }],
      },
    ];
  }
  const first = getAuthMenus(
    plugins,
    treeFor("role"),
    sidebarPermissions,
    true,
  );
  expect(first.find((menu) => menu.path === "/system").children[0].path).toBe(
    "/system/role",
  );
  const second = getAuthMenus(
    plugins,
    treeFor("manage"),
    sidebarPermissions,
    true,
  );
  expect(second.find((menu) => menu.path === "/system").children[0].path).toBe(
    "/system/manage",
  );
});

it("keeps locale-specific caches consistent after their permission source changes", () => {
  const plugins = [];
  const tree = [];
  window.sessionStorage.setItem("locale", "en-US");
  getAuthMenus(plugins, tree, sidebarPermissions, true);
  window.sessionStorage.setItem("locale", "zh-CN");
  const emptyPermissions = { menu: [] };
  expect(getAuthMenus(plugins, tree, emptyPermissions, true)).toEqual([]);
  window.sessionStorage.setItem("locale", "en-US");
  expect(getAuthMenus(plugins, tree, emptyPermissions, true)).toEqual([]);
  window.sessionStorage.removeItem("locale");
});
