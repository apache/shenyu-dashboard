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
import { act, fireEvent, render, screen } from "@testing-library/react";
import Form from "../../../components/ui/Form";
import Request from "./RequestRuleHandle";
import General from "./GeneralContextRuleHandle";
import Response from "./ResponseRuleHandle";
import Param from "./ParamPluginRuleHandle";
import ConnectedHystrix from "./HystrixRuleHandle";

jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));

function mountHandle(Component, handle, extra = {}) {
  let form;
  let editor;
  const Harness = Form.create()((props) => {
    form = props.form;
    return (
      <Form>
        <Component
          {...extra}
          form={form}
          handle={JSON.stringify(handle)}
          onRef={(ref) => {
            editor = ref;
          }}
        />
      </Form>
    );
  });
  render(<Harness />);
  return {
    read: () => JSON.parse(editor.getData(form.getFieldsValue())),
    form: () => form,
    editor: () => editor,
  };
}

it("round trips request operations across visited tabs and edits a header", () => {
  const h = mountHandle(Request, {
    parameter: { addParameters: { page: "0" } },
    header: { setHeaders: { "X-Test": "before" } },
    cookie: { removeCookieKeys: ["old"] },
  });
  fireEvent.click(screen.getByText("Headers"));
  fireEvent.change(screen.getByDisplayValue("before"), {
    target: { value: "after" },
  });
  fireEvent.click(screen.getByText("Cookies"));
  fireEvent.click(screen.getByText("Params"));
  expect(h.read()).toMatchObject({
    parameter: { addParameters: { page: "0" } },
    header: { setHeaders: { "X-Test": "after" } },
    cookie: { removeCookieKeys: ["old"] },
  });
});

it("round trips general context fields across all protocol tabs", () => {
  const handle = Object.fromEntries(
    ["dubbo", "grpc", "sofa", "motan"].map((name) => [
      name,
      [
        {
          generalContextType: "addGeneralContext",
          generalContextKey: name,
          generalContextValue: "0",
        },
      ],
    ]),
  );
  const h = mountHandle(General, handle);
  ["Grpc", "Sofa", "Motan", "Dubbo"].forEach((tab) =>
    fireEvent.click(screen.getByText(tab)),
  );
  expect(h.read()).toEqual(handle);
  act(() => h.editor().handleAddRow("dubbo"));
  const keys = h.form().getFieldValue("keys").dubbo;
  act(() => h.editor().handleDeleteRow("dubbo", keys[1]));
  expect(h.read()).toEqual(handle);
});

it("retains response body zero and false while editing another tab", () => {
  const handle = {
    statusCode: 201,
    setHeaders: { "X-Test": "keep" },
    addBodyKeys: [
      { path: "$.data", key: "count", value: 0 },
      { path: "$.data", key: "enabled", value: false },
    ],
  };
  const h = mountHandle(Response, handle);
  fireEvent.click(screen.getByText("Headers"));
  fireEvent.change(screen.getByDisplayValue("keep"), {
    target: { value: "changed" },
  });
  fireEvent.click(screen.getByText("Body"));
  expect(h.read()).toEqual({ ...handle, setHeaders: { "X-Test": "changed" } });
});

it("retains parameter mapping identity and false when another row is edited", () => {
  const handle = {
    addParameterKeys: [
      { path: "$.data", key: "enabled", value: false },
      { path: "$.data", key: "count", value: "before" },
    ],
  };
  const h = mountHandle(Param, handle);
  fireEvent.change(screen.getByDisplayValue("before"), {
    target: { value: "0" },
  });
  expect(h.read()).toEqual({
    addParameterKeys: [
      handle.addParameterKeys[0],
      { ...handle.addParameterKeys[1], value: "0" },
    ],
  });
});

it("keeps numeric Hystrix thread isolation and zero queue semantics", () => {
  const h = mountHandle(
    ConnectedHystrix.WrappedComponent,
    {
      executionIsolationStrategy: 0,
      timeout: "3000",
      hystrixThreadPoolConfig: {
        coreSize: 10,
        maximumSize: 12,
        maxQueueSize: 0,
      },
    },
    {
      platform: {
        hystrixIsolationModeEnums: [
          { code: 0, name: "Thread" },
          { code: 1, name: "Semaphore" },
        ],
      },
    },
  );
  expect(h.read()).toMatchObject({
    executionIsolationStrategy: 0,
    hystrixThreadPoolConfig: {
      coreSize: 10,
      maximumSize: 12,
      maxQueueSize: "0",
    },
  });
});

it("does not drop numeric zero or false request values", () => {
  const h = mountHandle(Request, {
    parameter: { addParameters: { count: 0, enabled: false } },
    header: {},
    cookie: {},
  });
  expect(h.read().parameter.addParameters).toEqual({
    count: 0,
    enabled: false,
  });
});
