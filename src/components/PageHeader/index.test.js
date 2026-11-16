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
import { render, screen } from "@testing-library/react";
import PageHeader, { getBreadcrumb } from "./index";
import BreadcrumbContext from "./BreadcrumbContext";
import { urlToList } from "../_utils/pathTools";

const routerData = {
  "/dashboard/analysis": {
    name: "分析页",
  },
  "/userinfo": {
    name: "用户列表",
  },
  "/userinfo/:id": {
    name: "用户信息",
  },
  "/userinfo/:id/addr": {
    name: "收货订单",
  },
};
describe("test getBreadcrumb", () => {
  it("Simple url", () => {
    expect(getBreadcrumb(routerData, "/dashboard/analysis").name).toEqual(
      "分析页",
    );
  });
  it("Parameters url", () => {
    expect(getBreadcrumb(routerData, "/userinfo/2144").name).toEqual(
      "用户信息",
    );
  });
  it("The middle parameter url", () => {
    expect(getBreadcrumb(routerData, "/userinfo/2144/addr").name).toEqual(
      "收货订单",
    );
  });
  it("Loop through the parameters", () => {
    const urlNameList = urlToList("/userinfo/2144/addr").map((url) => {
      return getBreadcrumb(routerData, url).name;
    });
    expect(urlNameList).toEqual(["用户列表", "用户信息", "收货订单"]);
  });

  it("a path", () => {
    const urlNameList = urlToList("/userinfo").map((url) => {
      return getBreadcrumb(routerData, url).name;
    });
    expect(urlNameList).toEqual(["用户列表"]);
  });
  it("Secondary path", () => {
    const urlNameList = urlToList("/userinfo/2144").map((url) => {
      return getBreadcrumb(routerData, url).name;
    });
    expect(urlNameList).toEqual(["用户列表", "用户信息"]);
  });
});

it("refreshes breadcrumbs when the current route context changes", () => {
  const map = { "/one": { name: "One" }, "/two": { name: "Two" } };
  const view = render(
    <BreadcrumbContext.Provider
      value={{ location: { pathname: "/one" }, breadcrumbNameMap: map }}
    >
      <PageHeader />
    </BreadcrumbContext.Provider>,
  );
  expect(screen.getByText("One")).toBeTruthy();
  view.rerender(
    <BreadcrumbContext.Provider
      value={{ location: { pathname: "/two" }, breadcrumbNameMap: map }}
    >
      <PageHeader />
    </BreadcrumbContext.Provider>,
  );
  expect(screen.queryByText("One")).toBeNull();
  expect(screen.getByText("Two")).toBeTruthy();
});

it("keeps root-relative route breadcrumbs on the current host", () => {
  const routes = [
    { path: "/", breadcrumbName: "Home route", component: () => null },
    { path: "users", breadcrumbName: "Users route", component: () => null },
    { path: ":id", breadcrumbName: "User detail" },
  ];
  render(<PageHeader routes={routes} params={{ id: "42" }} />);
  expect(
    screen.getByRole("link", { name: "Users route" }).getAttribute("href"),
  ).toBe("/users");
});
