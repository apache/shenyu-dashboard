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

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { urlToList } from "../_utils/pathTools";
import SiderMenu, { getFlatMenuKeys, getMenuMatchKeys } from "./SiderMenu";

const menu = [
  {
    path: "/dashboard",
    children: [
      {
        path: "/dashboard/name",
      },
    ],
  },
  {
    path: "/userinfo",
    children: [
      {
        path: "/userinfo/:id",
        children: [
          {
            path: "/userinfo/:id/info",
          },
        ],
      },
    ],
  },
];

const flatMenuKeys = getFlatMenuKeys(menu);

it("shows the authorized workbench route as the selected home entry", () => {
  const dispatch = jest.fn();
  render(
    <MemoryRouter initialEntries={["/home"]}>
      <SiderMenu
        dispatch={dispatch}
        menuData={[]}
        location={{ pathname: "/home" }}
      />
    </MemoryRouter>,
  );
  const home = screen.getByRole("link", { name: "Workbench" });
  expect(home.querySelector(".semi-navigation-item-selected")).not.toBeNull();
  fireEvent.click(home);
  expect(dispatch).toHaveBeenCalledWith({
    type: "global/saveCurrentRoutr",
    payload: {
      currentRouter: expect.objectContaining({ path: "/home" }),
    },
  });
});

describe("test convert nested menu to flat menu", () => {
  it("simple menu", () => {
    expect(flatMenuKeys).toEqual([
      "/dashboard",
      "/dashboard/name",
      "/userinfo",
      "/userinfo/:id",
      "/userinfo/:id/info",
    ]);
  });
});

describe("test menu match", () => {
  it("simple path", () => {
    expect(getMenuMatchKeys(flatMenuKeys, urlToList("/dashboard"))).toEqual([
      "/dashboard",
    ]);
  });

  it("error path", () => {
    expect(getMenuMatchKeys(flatMenuKeys, urlToList("/dashboardname"))).toEqual(
      [],
    );
  });

  it("Secondary path", () => {
    expect(
      getMenuMatchKeys(flatMenuKeys, urlToList("/dashboard/name")),
    ).toEqual(["/dashboard", "/dashboard/name"]);
  });

  it("Parameter path", () => {
    expect(getMenuMatchKeys(flatMenuKeys, urlToList("/userinfo/2144"))).toEqual(
      ["/userinfo", "/userinfo/:id"],
    );
  });

  it("three parameter path", () => {
    expect(
      getMenuMatchKeys(flatMenuKeys, urlToList("/userinfo/2144/info")),
    ).toEqual(["/userinfo", "/userinfo/:id", "/userinfo/:id/info"]);
  });
});

describe("SiderMenu#getSelectedMenuKeys", () => {
  it("matches a route added to menuData after construction", () => {
    // menuData can be populated asynchronously (e.g. plugin or permission
    // menus that load after the sider mounts), so the instance must derive
    // its flattened keys from the current menuData rather than a value
    // cached at construction time.
    const instance = new SiderMenu({
      menuData: menu,
      location: { pathname: "/dashboard" },
    });

    instance.props = {
      menuData: [
        ...menu,
        { path: "/plugin", children: [{ path: "/plugin/detail" }] },
      ],
      location: { pathname: "/plugin/detail" },
    };

    expect(instance.getSelectedMenuKeys()).toEqual([
      "/plugin",
      "/plugin/detail",
    ]);
  });
});

it("opens the active parents when menu data arrives without a route change", () => {
  const props = { menuData: menu, location: { pathname: "/dashboard/name" } };
  const next = SiderMenu.getDerivedStateFromProps(props, {
    prevPathname: "/dashboard/name",
    menuData: [],
    openKeys: [],
  });
  expect(next?.openKeys).toContain("/dashboard");
});

it("keeps other expanded branches when selecting a different route", () => {
  const next = SiderMenu.getDerivedStateFromProps(
    { menuData: menu, location: { pathname: "/userinfo/42/info" } },
    {
      prevPathname: "/dashboard/name",
      menuData: menu,
      openKeys: ["/dashboard"],
    },
  );
  expect(next.openKeys).toEqual(
    expect.arrayContaining(["/dashboard", "/userinfo", "/userinfo/:id"]),
  );
});

it("allows independent top-level menus to stay open", () => {
  const instance = new SiderMenu({
    menuData: menu,
    location: { pathname: "/home" },
  });
  instance.setState = jest.fn();
  const openKeys = Object.freeze(["/dashboard", "/userinfo"]);
  instance.handleOpenChange({ openKeys });
  expect(instance.setState).toHaveBeenCalledWith({ openKeys: [...openKeys] });
});

it("preserves a manually closed branch when equivalent menu data refreshes", () => {
  const next = SiderMenu.getDerivedStateFromProps(
    { menuData: [...menu], location: { pathname: "/dashboard/name" } },
    {
      prevPathname: "/dashboard/name",
      menuData: menu,
      openKeys: ["/userinfo"],
    },
  );
  expect(next.openKeys).toEqual(["/userinfo"]);
});

it("discards removed menu keys while keeping surviving expanded menus", () => {
  const next = SiderMenu.getDerivedStateFromProps(
    { menuData: [menu[1]], location: { pathname: "/home" } },
    {
      prevPathname: "/home",
      menuData: menu,
      openKeys: ["/dashboard", "/userinfo"],
    },
  );
  expect(next.openKeys).toEqual(["/userinfo"]);
});

it("renders late menu links without mutating input and dispatches route selection", () => {
  const dispatch = jest.fn();
  const data = Object.freeze([
    Object.freeze({
      path: "/system",
      name: "System",
      children: Object.freeze([
        Object.freeze({ path: "/system/manage", name: "Users", children: [] }),
      ]),
    }),
  ]);
  const props = {
    dispatch,
    menuData: [],
    location: { pathname: "/system/manage" },
    onCollapse: jest.fn(),
  };
  const view = render(
    <MemoryRouter>
      <SiderMenu {...props} />
    </MemoryRouter>,
  );
  view.rerender(
    <MemoryRouter>
      <SiderMenu {...props} menuData={data} />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("link", { name: "Users" }));
  expect(dispatch).toHaveBeenCalledWith({
    type: "global/saveCurrentRoutr",
    payload: { currentRouter: data[0].children[0] },
  });
});
