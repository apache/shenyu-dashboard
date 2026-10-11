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
import { ProxySelectorModalComponent } from "./ProxySelectorModal";

jest.mock("./ProxySelectorCopy.js", () => () => null);
jest.mock("./DiscoveryUpstreamTable", () => () => null);
jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
}));
jest.mock("../../../utils/utils", () => ({
  findKeyByValue: jest.fn(),
}));

beforeEach(() => {
  jest.spyOn(message, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("ignores missing copy data instead of dereferencing it", () => {
  const form = { setFieldsValue: jest.fn() };
  const dispatch = jest.fn();
  const component = new ProxySelectorModalComponent({ form, dispatch });

  expect(() => component.handleCopyData(undefined)).not.toThrow();

  expect(form.setFieldsValue).not.toHaveBeenCalled();
  expect(dispatch).not.toHaveBeenCalled();
  expect(message.warn).toHaveBeenCalled();
});

it("ignores copy data without discovery configuration", () => {
  const form = { setFieldsValue: jest.fn() };
  const dispatch = jest.fn();
  const component = new ProxySelectorModalComponent({ form, dispatch });

  component.handleCopyData({ id: "selector-1" });

  expect(form.setFieldsValue).not.toHaveBeenCalled();
  expect(dispatch).not.toHaveBeenCalled();
  expect(message.warn).toHaveBeenCalled();
});
