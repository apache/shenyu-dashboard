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
  render as renderView,
  waitFor,
} from "@testing-library/react";
import Rule from "./Rule";

jest.mock("react-redux", () => ({ connect: () => (component) => component }));
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock("./RuleCopy", () => () => null);

describe("Divide Rules form integration", () => {
  let container;
  let view;
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
    view = renderView(
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
      { container },
    );
  };
  const click = (suffix) =>
    fireEvent.click(
      Array.from(document.querySelectorAll("button")).find((button) =>
        button.textContent.endsWith(suffix),
      ),
    );
  const submit = async () => {
    await act(async () => {
      fireEvent.click(
        document.querySelector(".semi-modal-footer .semi-button-primary"),
      );
    });
  };
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    onSave = jest.fn();
  });
  afterEach(() => {
    view.unmount();
    container.remove();
  });
  it("uses the existing submit path and preserves unrelated handle fields", async () => {
    render({ retry: 2, timeout: 3000, custom: { tls: true }, canary });
    click("CANARY.CONFIG");
    fireEvent.change(
      document.querySelector(
        'input[aria-label="SHENYU.CANARY.CANARY_LABELS SHENYU.CANARY.VALUE 1"]',
      ),
      { target: { value: "beta" } },
    );
    await submit();
    await act(async () => {});
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
  it("blocks submitting invalid Canary, including while collapsed", async () => {
    render({ retry: 2, canary: { ...canary, stickyKey: undefined } });
    await submit();
    await act(async () => {});
    expect(onSave).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain("CANARY.SOURCE_REQUIRED");
  });
  it("does not add Canary on legacy edits", async () => {
    render({ retry: 2, custom: "retain" });
    await submit();
    await act(async () => {});
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(JSON.parse(onSave.mock.calls[0][0].handle)).toEqual({
      retry: 2,
      custom: "retain",
    });
  });
  it("removes Canary only after explicit removal and outer confirmation", async () => {
    render({ retry: 2, custom: "retain", canary });
    click("CANARY.REMOVE_CONFIG");
    fireEvent.click(
      await waitFor(
        () =>
          document.querySelector(".semi-popconfirm .semi-button-primary") ||
          Promise.reject(new Error("Confirmation not ready")),
      ),
    );
    expect(onSave).not.toHaveBeenCalled();
    await submit();
    await act(async () => {});
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
    act(() => complete());
    expect(document.body.textContent).toContain("CANARY.ADD_CONFIG");
  });
});
