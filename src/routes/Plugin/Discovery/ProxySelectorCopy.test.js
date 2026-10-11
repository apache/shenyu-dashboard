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

import { message } from "antd";
import { ProxySelectorCopyComponent } from "./ProxySelectorCopy";

jest.mock("../../../services/api", () => ({
  fetchProxySelector: jest.fn(),
}));
jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
}));

beforeEach(() => {
  jest.spyOn(message, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

const makeComponent = (props = {}) => {
  const component = new ProxySelectorCopyComponent(props);
  component.setState = (update) => {
    component.state = { ...component.state, ...update };
  };
  return component;
};

it("disables confirmation until a valid selector is selected", () => {
  const component = makeComponent({});
  component.state = {
    ...component.state,
    selectorList: [{ id: "selector-1", name: "Selector" }],
  };

  expect(component.render().props.okButtonProps.disabled).toBe(true);

  component.state.selectedValue = "selector-1";
  expect(component.render().props.okButtonProps.disabled).toBe(false);
});

it("does not call onOk when the selected selector is missing", async () => {
  const onOk = jest.fn();
  const component = makeComponent({ onOk });
  component.state = {
    ...component.state,
    selectedValue: "missing",
    selectorList: [{ id: "selector-1" }],
  };

  await component.handleOk();

  expect(onOk).not.toHaveBeenCalled();
  expect(message.warn).toHaveBeenCalled();
  expect(component.state.loading).toBe(false);
});

it("passes the selected selector to onOk", async () => {
  const onOk = jest.fn();
  const selected = { id: "selector-1", discovery: { type: "local" } };
  const component = makeComponent({ onOk });
  component.state = {
    ...component.state,
    selectedValue: "selector-1",
    selectorList: [selected],
  };

  await component.handleOk();

  expect(onOk).toHaveBeenCalledWith(selected);
});
