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
import { RegistryAddModal } from "./AddModal";

jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
}));

const baseValues = {
  registryId: "registry-1",
  protocol: "zookeeper",
  address: "127.0.0.1:2181",
  username: "alice",
  namespace: "namespace",
  group: "group",
};
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

it("omits an untouched password when editing a registry", () => {
  const handleOk = jest.fn();
  const component = new RegistryAddModal({
    detail: { id: "registry-row-1" },
    handleOk,
    form: submitForm({ ...baseValues, password: "" }),
  });
  component.handleSubmit({ preventDefault: jest.fn() });
  expect(handleOk).toHaveBeenCalledWith({
    ...baseValues,
    id: "registry-row-1",
  });
});

it("submits an explicitly entered registry replacement password", () => {
  const handleOk = jest.fn();
  const component = new RegistryAddModal({
    detail: { id: "registry-row-1" },
    handleOk,
    form: submitForm({ ...baseValues, password: "replacement" }),
  });
  component.handleSubmit({ preventDefault: jest.fn() });
  expect(handleOk).toHaveBeenCalledWith({
    ...baseValues,
    password: "replacement",
    id: "registry-row-1",
  });
});

it("renders registry passwords with a masked input", () => {
  const component = new RegistryAddModal({
    detail: {},
    form: renderForm(),
  });
  expect(findField(component.render(), "password").type).toBe(Input.Password);
});
