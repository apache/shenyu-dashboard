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
import ConnectedSelector from "./Selector";

jest.mock("./SelectorCopy", () => () => null);
jest.mock("../Discovery/DiscoveryLookupModal", () => () => null);
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
const Selector = Form.create()(ConnectedSelector.WrappedComponent);
const upstream = {
  key: 1,
  id: "upstream-1",
  protocol: "http://",
  url: "example.invalid:8080",
  status: 0,
  weight: 0,
  startupTime: 0,
  warmupTime: 0,
  gray: false,
};
function mount(extra = {}) {
  let callback;
  const handleOk = jest.fn();
  const dispatch = jest.fn(({ type, payload }) => {
    if (type === "pluginHandle/fetchByPluginId") callback = payload.callBack;
    if (type === "shenyuDict/fetchByType") payload.callBack([]);
  });
  render(
    <Selector
      dispatch={dispatch}
      pluginId="20"
      pluginName="fixture"
      platform={{
        selectorTypeEnums: [
          { code: 0, name: "All" },
          { code: 1, name: "Custom" },
        ],
      }}
      discovery={{ typeEnums: ["local", "zookeeper"] }}
      name="fixture"
      type={0}
      sort={1}
      logged={false}
      enabled={false}
      continued={false}
      handleOk={handleOk}
      onCancel={jest.fn()}
      {...extra}
    />,
  );
  return { handleOk, resolve: (fields) => act(() => callback(fields)) };
}
it("retains zero, false and flags when saving a structured selector", async () => {
  const h = mount();
  h.resolve([
    [
      { field: "count", label: "Count", dataType: 1, value: 0 },
      {
        field: "flag",
        label: "Flag",
        dataType: 3,
        value: false,
        dictOptions: [{ dictValue: false, dictName: "False" }],
      },
    ],
  ]);
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(h.handleOk).toHaveBeenCalledTimes(1));
  expect(h.handleOk.mock.calls[0][0]).toMatchObject({
    logged: false,
    enabled: false,
    continued: false,
    sort: 1,
  });
  expect(JSON.parse(h.handleOk.mock.calls[0][0].handle)).toEqual({
    count: 0,
    flag: "false",
  });
});
it("saves an upstream row independently of the parent selector form", async () => {
  const h = mount({
    pluginId: "5",
    isDiscovery: true,
    isAdd: true,
    discoveryConfig: { discoveryType: "" },
    discoveryUpstreams: [upstream],
  });
  h.resolve([]);
  fireEvent.click(
    screen.getByRole("tab", {
      name: "SHENYU.DISCOVERY.SELECTOR.CONFIG.DISCOVERY",
    }),
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "SHENYU.DISCOVERY.SELECTOR.UPSTREAM.EDIT",
    }),
  );
  fireEvent.change(screen.getByDisplayValue("example.invalid:8080"), {
    target: { value: "updated.invalid:8080" },
  });
  fireEvent.click(
    screen.getByRole("button", {
      name: "SHENYU.DISCOVERY.SELECTOR.UPSTREAM.SAVE",
    }),
  );
  expect(h.handleOk).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(h.handleOk).toHaveBeenCalledTimes(1));
  expect(h.handleOk.mock.calls[0][0].upstreams).toEqual([
    { ...upstream, url: "updated.invalid:8080" },
  ]);
  expect(document.querySelectorAll("form form")).toHaveLength(0);
});
