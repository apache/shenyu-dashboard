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
import Namespace from "../../routes/System/Namespace/AddModal";
import Registry from "../../routes/System/Registry/AddModal";
import User from "../../routes/System/User/AddModal";

jest.mock("../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));

it("preserves a namespace identifier and explicit blank description", async () => {
  const onSave = jest.fn();
  render(
    <Namespace
      id="row-1"
      namespaceId="namespace-1"
      name="demo"
      description=""
      handleOk={onSave}
    />,
  );
  expect(
    screen.getByPlaceholderText("SHENYU.NAMESPACE.ALERTNAMESPACEID").disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(onSave).toHaveBeenCalledWith({
      id: "row-1",
      namespaceId: "namespace-1",
      name: "demo",
      description: "",
    }),
  );
});

it("keeps registry identity disabled and never prefills or resubmits its stored password", async () => {
  const onSave = jest.fn();
  const detail = {
    id: "registry-row",
    registryId: "registry-1",
    protocol: "zookeeper",
    address: "localhost:2181",
    username: "alice",
    namespace: "n",
    group: "g",
    password: "masked-test-value",
  };
  render(<Registry detail={detail} handleOk={onSave} />);
  expect(
    screen.getByPlaceholderText("SHENYU.REGISTRY.REGISTRY_ID.INPUT").disabled,
  ).toBe(true);
  const password = screen.getByPlaceholderText(
    "SHENYU.REGISTRY.PASSPORT.INPUT",
  );
  expect(password.type).toBe("password");
  expect(password.value).toBe("");
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  const expected = { ...detail };
  delete expected.password;
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expected));
});

it("preserves disabled users, role IDs and an untouched password during edit", async () => {
  const onSave = jest.fn();
  render(
    <User
      id="user-1"
      userName="alice"
      roles={[{ id: "reader" }]}
      allRoles={[{ id: "reader", roleName: "Reader" }]}
      enabled={false}
      handleOk={onSave}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(onSave).toHaveBeenCalledWith({
      id: "user-1",
      userName: "alice",
      roles: ["reader"],
      enabled: false,
    }),
  );
});

it("requires a password for a new user", async () => {
  const onSave = jest.fn();
  render(
    <User
      userName="alice"
      roles={[{ id: "reader" }]}
      allRoles={[{ id: "reader", roleName: "Reader" }]}
      handleOk={onSave}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await screen.findByText("SHENYU.SYSTEM.USER.PASSWORD");
  expect(onSave).not.toHaveBeenCalled();
});
