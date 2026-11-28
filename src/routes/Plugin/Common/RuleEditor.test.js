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
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import Form from "../../../components/ui/Form";
import ConnectedRule from "./Rule";

jest.mock("./RuleCopy", () => () => null);
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
const Rule = Form.create()(ConnectedRule.WrappedComponent);
const conditions = [
  {
    paramType: "uri",
    paramName: "/",
    operator: "pathPattern",
    paramValue: "/fixture/**",
  },
];
function mount(extra = {}) {
  const handleOk = jest.fn();
  let handles;
  const dispatch = jest.fn(({ type, payload }) => {
    if (type === "pluginHandle/fetchByPluginId") handles = payload.callBack;
    if (type === "shenyuDict/fetchByType")
      payload.callBack([{ dictValue: "0", dictName: "and" }]);
  });
  render(
    <Rule
      dispatch={dispatch}
      pluginName="divide"
      pluginId="5"
      name="fixture"
      matchMode={0}
      sort={1}
      logged={false}
      enabled={false}
      matchRestful={false}
      handle='{"retry":0,"enabled":false}'
      ruleConditions={conditions.map((v) => ({ ...v }))}
      handleOk={handleOk}
      onCancel={jest.fn()}
      {...extra}
    />,
  );
  return {
    handleOk,
    resolve: (fields = [], json = true) => act(() => handles(fields, json)),
  };
}
it("submits JSON with false flags and zero values", async () => {
  const h = mount();
  h.resolve();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(h.handleOk).toHaveBeenCalledTimes(1));
  expect(h.handleOk.mock.calls[0][0]).toMatchObject({
    name: "fixture",
    enabled: false,
    logged: false,
    matchRestful: false,
    sort: 1,
    handle: '{"retry":0,"enabled":false}',
    ruleConditions: conditions,
  });
});
it("opens a custom request rule before handle metadata arrives and retains unvisited tabs", async () => {
  const handle = {
    header: { setHeaders: { "X-Flag": "false" } },
    parameter: { addParameters: { n: "0" } },
    cookie: { removeCookieKeys: ["old"] },
  };
  const h = mount({ pluginName: "request", handle: JSON.stringify(handle) });
  h.resolve();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(h.handleOk).toHaveBeenCalledTimes(1));
  expect(JSON.parse(h.handleOk.mock.calls[0][0].handle)).toMatchObject(handle);
});
it("creates a disabled shadow handle without raw JSON or metadata", async () => {
  const h = mount({ pluginName: "shadow", handle: undefined });
  expect(
    screen
      .getByRole("switch", { name: "SHENYU.SHADOW.ENABLE" })
      .getAttribute("aria-checked"),
  ).toBe("false");
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(h.handleOk).toHaveBeenCalledTimes(1));
  expect(JSON.parse(h.handleOk.mock.calls[0][0].handle)).toMatchObject({
    enabled: false,
    sampleRate: 0,
    methods: ["GET", "HEAD", "OPTIONS", "TRACE"],
    forwardHeaders: ["Accept", "Content-Type"],
  });
});

it("edits a shadow handle and saves numbers, arrays, and headers with their JSON types", async () => {
  const h = mount({
    pluginName: "shadow",
    handle: JSON.stringify({
      enabled: true,
      target: "https://candidate.example/preview",
      sampleRate: 0.2,
      queueCapacity: 0,
      compareHeaders: [],
      extraHeaders: { "X-Environment": "candidate" },
      futureOption: true,
    }),
  });
  expect(screen.getByLabelText("SHENYU.SHADOW.TARGET").value).toBe(
    "https://candidate.example/preview",
  );
  fireEvent.change(screen.getByLabelText("SHENYU.SHADOW.SAMPLE_RATE"), {
    target: { value: "0.5" },
  });
  fireEvent.change(screen.getByLabelText("SHENYU.SHADOW.IGNORE_JSON_PATHS"), {
    target: { value: "$.createdAt\n$.items.id" },
  });
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(h.handleOk).toHaveBeenCalledTimes(1));
  expect(h.handleOk.mock.calls[0][0].enabled).toBe(false);
  expect(JSON.parse(h.handleOk.mock.calls[0][0].handle)).toMatchObject({
    enabled: true,
    sampleRate: 0.5,
    queueCapacity: 0,
    compareHeaders: [],
    ignoreJsonPaths: ["$.createdAt", "$.items.id"],
    extraHeaders: { "X-Environment": "candidate" },
    futureOption: true,
  });
});

it("blocks an enabled shadow rule without a destination and rejects invalid bounds or headers", async () => {
  const h = mount({ pluginName: "shadow", handle: undefined });
  fireEvent.click(screen.getByRole("switch", { name: "SHENYU.SHADOW.ENABLE" }));
  fireEvent.change(screen.getByLabelText("SHENYU.SHADOW.METHODS"), {
    target: { value: "" },
  });
  fireEvent.change(screen.getByLabelText("SHENYU.SHADOW.SAMPLE_RATE"), {
    target: { value: "1.5" },
  });
  fireEvent.change(screen.getByLabelText("SHENYU.SHADOW.QUEUE_CAPACITY"), {
    target: { value: "1.5" },
  });
  fireEvent.change(screen.getByLabelText("SHENYU.SHADOW.EXTRA_HEADERS"), {
    target: { value: '{"X-Flag":true}' },
  });
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  expect(await screen.findByText("SHENYU.SHADOW.TARGET_INVALID")).toBeTruthy();
  expect(screen.getByText("SHENYU.SHADOW.METHODS_INVALID")).toBeTruthy();
  expect(screen.getByText("SHENYU.SHADOW.SAMPLE_RATE_INVALID")).toBeTruthy();
  expect(screen.getByText("SHENYU.SHADOW.QUEUE_CAPACITY_INVALID")).toBeTruthy();
  expect(screen.getByText("SHENYU.SHADOW.EXTRA_HEADERS_INVALID")).toBeTruthy();
  expect(h.handleOk).not.toHaveBeenCalled();
});

it("keeps date and time components of a time condition", () => {
  mount({
    ruleConditions: [
      {
        paramType: "header",
        paramName: "timestamp",
        operator: "TimeAfter",
        paramValue: "2026-11-15 12:34:56",
      },
    ],
  });
  expect(screen.getByDisplayValue("2026-11-15")).toBeTruthy();
  expect(screen.getByDisplayValue("12:34:56")).toBeTruthy();
});

it("submits structured metadata with zero and false after delayed loading", async () => {
  const h = mount();
  h.resolve(
    [
      [
        { field: "retry", label: "Retry", dataType: 1, value: 0 },
        {
          field: "enabled",
          label: "Enabled",
          dataType: 3,
          value: false,
          dictOptions: [
            { dictValue: true, dictName: "True" },
            { dictValue: false, dictName: "False" },
          ],
        },
      ],
    ],
    false,
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(h.handleOk).toHaveBeenCalledTimes(1));
  expect(JSON.parse(h.handleOk.mock.calls[0][0].handle)).toEqual({
    retry: 0,
    enabled: "false",
  });
});

it("blocks submission until handle metadata has loaded", () => {
  const h = mount();
  expect(
    screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }).disabled,
  ).toBe(true);
  fireEvent.submit(document.querySelector("form"));
  expect(h.handleOk).not.toHaveBeenCalled();
  h.resolve();
  expect(
    screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }).disabled,
  ).toBe(false);
});

it("serializes a time edit as HH:mm:ss instead of a Date description", async () => {
  const h = mount({
    ruleConditions: [
      {
        paramType: "header",
        paramName: "timestamp",
        operator: "TimeAfter",
        paramValue: "2026-11-15 12:34:56",
      },
    ],
  });
  h.resolve();
  const input = screen.getByDisplayValue("12:34:56");
  fireEvent.change(input, { target: { value: "13:35:57" } });
  fireEvent.blur(input);
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(h.handleOk).toHaveBeenCalledTimes(1));
  expect(h.handleOk.mock.calls[0][0].ruleConditions[0].paramValue).toBe(
    "2026-11-15 13:35:57",
  );
});

it("serializes a date edit while keeping its time component", async () => {
  const h = mount({
    ruleConditions: [
      {
        paramType: "header",
        paramName: "timestamp",
        operator: "TimeAfter",
        paramValue: "2026-11-15 12:34:56",
      },
    ],
  });
  h.resolve();
  const input = screen.getByDisplayValue("2026-11-15");
  fireEvent.change(input, { target: { value: "2026-11-16" } });
  fireEvent.keyDown(input, { key: "Enter", keyCode: 13 });
  fireEvent.blur(input);
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(h.handleOk).toHaveBeenCalledTimes(1));
  expect(h.handleOk.mock.calls[0][0].ruleConditions[0].paramValue).toBe(
    "2026-11-16 12:34:56",
  );
});
