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
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Resource from "../../routes/System/Resource/AddModal";

jest.mock("../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
const menus = [
  { id: "plugins", title: "Plugins", url: "/plug" },
  { id: "config", title: "Config", url: "/config" },
];

it("keeps immutable menu identity, parent IDs, zero ordering and icon names", async () => {
  const handleOk = jest.fn();
  render(
    <Resource
      id="resource"
      resourceType={1}
      title="Menu"
      url="/example"
      parentId="config"
      sort={0}
      icon="home"
      menuTree={menus}
      handleOk={handleOk}
    />,
  );
  expect(screen.getByPlaceholderText("SHENYU.SYSTEM.ICON.INPUT").readOnly).toBe(
    true,
  );
  expect(
    screen.getByPlaceholderText("SHENYU.SYSTEM.RESOURCENAME.INPUT").disabled,
  ).toBe(true);
  expect(
    screen.getByPlaceholderText("SHENYU.SYSTEM.ROUTER.INPUT").disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith({
      id: "resource",
      resourceType: 1,
      title: "Menu",
      url: "/example",
      parentId: "config",
      sort: 0,
      icon: "home",
    }),
  );
});

it("omits menu-only fields from button resources", async () => {
  const handleOk = jest.fn();
  render(
    <Resource
      id="button"
      resourceType={2}
      title="Action"
      perms="example:read"
      icon="search"
      parentId="config"
      url="/ignored"
      sort={10}
      menuTree={menus}
      handleOk={handleOk}
    />,
  );
  expect(
    screen.queryByPlaceholderText("SHENYU.SYSTEM.ROUTER.INPUT"),
  ).toBeNull();
  expect(
    screen.getByPlaceholderText("SHENYU.SYSTEM.RESOURCE.PERMS.INPUT").disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith({
      id: "button",
      resourceType: 2,
      title: "Action",
      perms: "example:read",
      icon: "search",
    }),
  );
});

it("does not allow the plugin root as a menu parent", async () => {
  const handleOk = jest.fn();
  render(
    <Resource
      resourceType={1}
      title="Menu"
      url="/example"
      sort={0}
      menuTree={menus}
      handleOk={handleOk}
    />,
  );
  fireEvent.click(
    screen.getByText("SHENYU.SYSTEM.RESOURCE.PARENT.INPUT", { exact: true }),
  );
  const plugin = await screen.findByRole("option", {
    name: /Plugins$/,
    exact: true,
  });
  expect(plugin.getAttribute("aria-disabled")).toBe("true");
  fireEvent.click(plugin);
  expect(plugin.getAttribute("aria-selected")).toBe("false");
  fireEvent.click(screen.getByRole("option", { name: /Config$/, exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith(
      expect.objectContaining({ parentId: "config" }),
    ),
  );
});

it("filters the icon picker and submits the selected legacy name", async () => {
  const handleOk = jest.fn();
  render(
    <Resource
      resourceType={0}
      title="Menu"
      url="/example"
      sort={0}
      menuTree={[]}
      handleOk={handleOk}
    />,
  );
  fireEvent.click(
    screen.queryByRole("button", { name: "SHENYU.SYSTEM.ICON.INPUT" }) ||
      screen.getByLabelText("icon: plus"),
  );
  fireEvent.change(screen.getByPlaceholderText("SHENYU.SYSTEM.ICON.SEARCH"), {
    target: { value: "  home  " },
  });
  expect(screen.queryByText("github", { exact: true })).toBeNull();
  fireEvent.click(screen.getByText("home", { exact: true }));
  await waitFor(() =>
    expect(
      screen.queryByPlaceholderText("SHENYU.SYSTEM.ICON.SEARCH"),
    ).toBeNull(),
  );
  expect(screen.getByPlaceholderText("SHENYU.SYSTEM.ICON.INPUT").value).toBe(
    "home",
  );
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "SHENYU.SYSTEM.ICON.INPUT" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith(
      expect.objectContaining({ icon: "home" }),
    ),
  );
});

it("validates missing names and routes before saving", async () => {
  const handleOk = jest.fn();
  render(
    <Resource resourceType={0} sort={0} menuTree={[]} handleOk={handleOk} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await screen.findByText("SHENYU.SYSTEM.RESOURCENAME.INPUT");
  expect(handleOk).not.toHaveBeenCalled();
});

it("clears both the selected icon and its preview", async () => {
  const handleOk = jest.fn();
  render(
    <Resource
      resourceType={0}
      title="Menu"
      url="/example"
      sort={0}
      icon="home"
      menuTree={[]}
      handleOk={handleOk}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.SYSTEM.ICON.CLEAR" }),
  );
  const input = screen.getByPlaceholderText("SHENYU.SYSTEM.ICON.INPUT");
  expect(input.value).toBe("");
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "SHENYU.SYSTEM.ICON.INPUT" }),
  );
  expect(input.closest(".semi-input-wrapper").querySelector("svg")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith(
      expect.objectContaining({ icon: "" }),
    ),
  );
});

it("shows an empty search result and returns to the resource draft on cancel", async () => {
  render(
    <Resource
      resourceType={0}
      title="Menu"
      url="/example"
      sort={0}
      icon="home"
      menuTree={[]}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.SYSTEM.ICON.INPUT" }),
  );
  fireEvent.change(screen.getByPlaceholderText("SHENYU.SYSTEM.ICON.SEARCH"), {
    target: { value: "nonexistent-icon" },
  });
  expect(screen.getByRole("status").textContent).toBe(
    "SHENYU.SYSTEM.ICON.EMPTY",
  );
  const search = screen.getByPlaceholderText("SHENYU.SYSTEM.ICON.SEARCH");
  const picker = search.closest(".semi-modal");
  fireEvent.click(
    [...picker.querySelectorAll("button")].find(
      (button) => button.textContent === "SHENYU.COMMON.CALCEL",
    ),
  );
  await waitFor(() =>
    expect(
      screen.queryByPlaceholderText("SHENYU.SYSTEM.ICON.SEARCH"),
    ).toBeNull(),
  );
  expect(screen.getByPlaceholderText("SHENYU.SYSTEM.ICON.INPUT").value).toBe(
    "home",
  );
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "SHENYU.SYSTEM.ICON.INPUT" }),
  );
});

it("closes only the icon picker when Escape is pressed", async () => {
  const handleCancel = jest.fn();
  render(
    <Resource
      resourceType={0}
      title="Draft menu"
      url="/example"
      sort={0}
      menuTree={[]}
      handleCancel={handleCancel}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.SYSTEM.ICON.INPUT" }),
  );
  fireEvent.keyDown(document, { key: "Escape", keyCode: 27 });
  await waitFor(() =>
    expect(
      screen.queryByPlaceholderText("SHENYU.SYSTEM.ICON.SEARCH"),
    ).toBeNull(),
  );
  expect(handleCancel).not.toHaveBeenCalled();
  expect(
    screen.getByPlaceholderText("SHENYU.SYSTEM.RESOURCENAME.INPUT").value,
  ).toBe("Draft menu");
});
