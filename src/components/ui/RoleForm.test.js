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
import Role from "../../routes/System/Role/AddModal";

jest.mock("../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));

const tree = () => [
  {
    id: "system",
    name: "system",
    title: "System",
    children: [
      { id: "read", name: "read", title: "Read", isLeaf: true },
      { id: "write", name: "write", title: "Write", isLeaf: true },
    ],
  },
  {
    id: "plug",
    name: "plug",
    title: "Plugins",
    children: [
      {
        id: "divide",
        name: "divide",
        title: "Divide",
        children: [
          {
            id: "divide-read",
            name: "divide-read",
            title: "Read divide",
            isLeaf: true,
          },
        ],
      },
      {
        id: "sentinel",
        name: "sentinel",
        title: "Sentinel",
        children: [
          {
            id: "sentinel-read",
            name: "sentinel-read",
            title: "Read sentinel",
            isLeaf: true,
          },
        ],
      },
    ],
  },
];
function mount(handleOk, rolePermissionList = []) {
  return render(
    <Role
      sysRole={{ id: "reader-role", roleName: "Reader", description: "" }}
      allPermissionInfo={{ treeList: tree() }}
      rolePermissionList={rolePermissionList}
      handleOk={handleOk}
    />,
  );
}
function check(label) {
  const node = screen.getByText(label, { exact: true }).closest("li");
  fireEvent.click(node.querySelector(".ant-tree-checkbox, .semi-checkbox"));
}
async function save(handleOk, expected) {
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(handleOk).toHaveBeenCalledTimes(1));
  const result = handleOk.mock.calls[0][0];
  expect(result).toEqual({
    id: "reader-role",
    roleName: "Reader",
    description: "",
    currentPermissionIds: expect.any(Array),
  });
  expect([...result.currentPermissionIds].sort()).toEqual([...expected].sort());
}

it("expands existing leaf grants to their ancestor paths", async () => {
  const handleOk = jest.fn();
  mount(handleOk, ["system", "read", "plug", "divide", "divide-read"]);
  await save(handleOk, ["system", "read", "plug", "divide", "divide-read"]);
});

it("cascades a parent selection without losing grants in another root", async () => {
  const handleOk = jest.fn();
  mount(handleOk, ["divide-read"]);
  check("System");
  await save(handleOk, [
    "system",
    "read",
    "write",
    "plug",
    "divide",
    "divide-read",
  ]);
});

it("removes deselected leaves and now-unused ancestors", async () => {
  const handleOk = jest.fn();
  mount(handleOk, ["read", "write", "divide-read"]);
  check("System");
  await save(handleOk, ["plug", "divide", "divide-read"]);
});

it("preserves filtered-out plugin grants when another root is edited", async () => {
  const handleOk = jest.fn();
  mount(handleOk, ["sentinel-read"]);
  fireEvent.change(screen.getByPlaceholderText("Filter by plugin name"), {
    target: { value: "divide" },
  });
  check("System");
  await save(handleOk, [
    "system",
    "read",
    "write",
    "plug",
    "sentinel",
    "sentinel-read",
  ]);
});

it("requires a role name", async () => {
  const handleOk = jest.fn();
  render(
    <Role
      sysRole={{}}
      allPermissionInfo={{ treeList: [] }}
      handleOk={handleOk}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await screen.findByText("SHENYU.SYSTEM.ROLE.INPUT.NAME");
  expect(handleOk).not.toHaveBeenCalled();
});

it("preserves hidden grants while selecting a matching plugin in the same root", async () => {
  const handleOk = jest.fn();
  mount(handleOk, ["sentinel-read"]);
  fireEvent.change(screen.getByPlaceholderText("Filter by plugin name"), {
    target: { value: "divide" },
  });
  check("Divide");
  await save(handleOk, [
    "plug",
    "sentinel",
    "sentinel-read",
    "divide",
    "divide-read",
  ]);
});

it("handles the create caller's empty permission objects", async () => {
  const handleOk = jest.fn();
  render(
    <Role
      sysRole={{ roleName: "New role" }}
      allPermissionInfo={{}}
      rolePermissionList={{}}
      handleOk={handleOk}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith({
      id: "",
      roleName: "New role",
      description: "",
      currentPermissionIds: [],
    }),
  );
});

it("resets both dirty form fields and grants when the edited role changes", async () => {
  const handleOk = jest.fn();
  const { rerender } = mount(handleOk, ["read"]);
  fireEvent.change(
    screen.getByPlaceholderText("SHENYU.SYSTEM.ROLE.INPUT.NAME"),
    { target: { value: "Unsaved draft" } },
  );
  check("System");
  rerender(
    <Role
      sysRole={{ id: "second", roleName: "Second" }}
      allPermissionInfo={{ treeList: tree() }}
      rolePermissionList={["divide-read"]}
      handleOk={handleOk}
    />,
  );
  expect(
    screen.getByPlaceholderText("SHENYU.SYSTEM.ROLE.INPUT.NAME").value,
  ).toBe("Second");
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith({
      id: "second",
      roleName: "Second",
      description: "",
      currentPermissionIds: ["divide-read", "plug", "divide"],
    }),
  );
});

it("does not mutate the shared permission tree", () => {
  const treeList = tree();
  const original = JSON.parse(JSON.stringify(treeList));
  render(
    <Role
      sysRole={{ roleName: "Reader" }}
      allPermissionInfo={{ treeList }}
      rolePermissionList={["read"]}
    />,
  );
  fireEvent.change(screen.getByPlaceholderText("Filter by plugin name"), {
    target: { value: "divide" },
  });
  expect(treeList).toEqual(original);
});
