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
import ReactDOM from "react-dom";
import { Simulate } from "react-dom/test-utils";
import Rule from "./Rule";

jest.mock("dva", () => ({ connect: () => (component) => component }));
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock("./RuleCopy", () => () => null);

describe("Divide Rules form integration", () => {
  let container;
  let onSave;
  const canary = {
    enabled: true,
    percentage: 10,
    stableLabels: { release: "stable" },
    canaryLabels: { release: "canary" },
    stickyKey: { paramType: "header", paramName: "x-user-id" },
    conditions: [],
  };
  const dispatch = ({ type, payload }) => {
    if (type === "shenyuDict/fetchByType") {
      const values = {
        paramType: ["uri", "header", "custom-user"],
        operator: ["=", "isBlank", "pathPattern"],
        matchMode: ["0", "1"],
      };
      payload.callBack(
        values[payload.type].map((value) => ({
          dictValue: value,
          dictName: value,
        })),
      );
    }
    if (type === "pluginHandle/fetchByPluginId")
      payload.callBack(
        [[{ field: "retry", label: "retryCount", dataType: 1, value: 2 }]],
        false,
      );
  };
  const render = (handle, pluginName = "divide", send = dispatch) => {
    ReactDOM.render(
      <Rule
        dispatch={send}
        pluginId="divide-id"
        pluginName={pluginName}
        handle={JSON.stringify(handle)}
        name="canary-test"
        sort="1"
        matchMode="0"
        ruleConditions={[
          {
            paramType: "uri",
            operator: "pathPattern",
            paramName: "/",
            paramValue: "/orders/**",
          },
        ]}
        handleOk={onSave}
        onCancel={() => {}}
      />,
      container,
    );
  };
  const click = (suffix) =>
    Simulate.click(
      Array.from(document.querySelectorAll("button")).find((button) =>
        button.textContent.endsWith(suffix),
      ),
    );
  const submit = () =>
    Simulate.click(
      document.querySelector(".ant-modal-footer .ant-btn-primary"),
    );
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    onSave = jest.fn();
  });
  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });
  it("uses the existing submit path and preserves unrelated handle fields", () => {
    render({ retry: 2, timeout: 3000, custom: { tls: true }, canary });
    click("CANARY.CONFIG");
    Simulate.change(
      document.querySelector(
        'input[aria-label="SHENYU.CANARY.CANARY_LABELS SHENYU.CANARY.VALUE 1"]',
      ),
      { target: { value: "beta" } },
    );
    submit();
    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0][0];
    expect(JSON.parse(saved.handle)).toMatchObject({
      timeout: 3000,
      custom: { tls: true },
      canary: { canaryLabels: { release: "beta" }, percentage: 10 },
    });
    expect(saved.ruleConditions[0].paramValue).toBe("/orders/**");
    expect(saved.enabled).toBe(true);
  });
  it("blocks submitting invalid Canary, including while collapsed", () => {
    render({ retry: 2, canary: { ...canary, stickyKey: undefined } });
    submit();
    expect(onSave).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain("CANARY.SOURCE_REQUIRED");
  });
  it("does not add Canary on legacy edits", () => {
    render({ retry: 2, custom: "retain" });
    submit();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(JSON.parse(onSave.mock.calls[0][0].handle)).toEqual({
      retry: 2,
      custom: "retain",
    });
  });
  it("removes Canary only after explicit removal and outer confirmation", () => {
    render({ retry: 2, custom: "retain", canary });
    click("CANARY.REMOVE_CONFIG");
    Simulate.click(document.querySelector(".ant-popover .ant-btn-primary"));
    expect(onSave).not.toHaveBeenCalled();
    submit();
    expect(JSON.parse(onSave.mock.calls[0][0].handle)).toEqual({
      retry: 2,
      custom: "retain",
    });
  });
  it("does not show Canary on another plugin", () => {
    render({ retry: 2 }, "other-plugin");
    expect(document.body.textContent).not.toContain("CANARY.ADD_CONFIG");
  });
  it("shows Canary after the handle schema arrives asynchronously", () => {
    let complete;
    render({}, "divide", (request) => {
      if (request.type === "pluginHandle/fetchByPluginId") {
        complete = () => dispatch(request);
      } else {
        dispatch(request);
      }
    });
    expect(document.body.textContent).not.toContain("CANARY.ADD_CONFIG");
    complete();
    expect(document.body.textContent).toContain("CANARY.ADD_CONFIG");
  });
});
