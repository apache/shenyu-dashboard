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
import { Input } from "antd";
import { UserAddModal } from "./AddModal";

jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
}));

const submitForm = (values) => ({
  validateFieldsAndScroll: (callback) => callback(null, values),
});
const renderForm = () => ({
  getFieldDecorator:
    (name, options = {}) =>
    (element) =>
      React.cloneElement(element, {
        "data-field-name": name,
        "data-field-options": options,
      }),
});
const findField = (node, name) => {
  if (!React.isValidElement(node)) return null;
  if (node.props["data-field-name"] === name) return node;
  return React.Children.toArray(node.props.children).reduce(
    (match, child) => match || findField(child, name),
    null,
  );
};

it("omits an untouched password when editing a user", () => {
  const handleOk = jest.fn();
  const component = new UserAddModal({
    id: "user-1",
    handleOk,
    form: submitForm({
      userName: "alice",
      password: "",
      roles: ["role-1"],
      enabled: true,
    }),
  });
  component.handleSubmit({ preventDefault: jest.fn() });
  expect(handleOk).toHaveBeenCalledWith({
    userName: "alice",
    roles: ["role-1"],
    enabled: true,
    id: "user-1",
  });
});

it("submits an explicitly entered replacement password", () => {
  const handleOk = jest.fn();
  const component = new UserAddModal({
    id: "user-1",
    handleOk,
    form: submitForm({
      userName: "alice",
      password: "replacement",
      roles: ["role-1"],
      enabled: true,
    }),
  });
  component.handleSubmit({ preventDefault: jest.fn() });
  expect(handleOk).toHaveBeenCalledWith(
    expect.objectContaining({ id: "user-1", password: "replacement" }),
  );
});

it("masks the password and requires it only on create", () => {
  const create = new UserAddModal({ form: renderForm(), allRoles: [] });
  const edit = new UserAddModal({
    id: "user-1",
    form: renderForm(),
    allRoles: [],
  });
  const createPassword = findField(create.render(), "password");
  const editPassword = findField(edit.render(), "password");

  expect(createPassword.type).toBe(Input.Password);
  expect(editPassword.type).toBe(Input.Password);
  expect(createPassword.props["data-field-options"].rules[0].required).toBe(
    true,
  );
  expect(editPassword.props["data-field-options"].rules[0].required).toBe(
    false,
  );
});
