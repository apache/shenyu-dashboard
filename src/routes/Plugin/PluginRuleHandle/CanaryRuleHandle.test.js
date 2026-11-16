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
import CanaryRuleHandle from "./CanaryRuleHandle";

jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));

describe("Canary editor", () => {
  let container;
  let editor;
  const original = {
    canary: {
      enabled: true,
      percentage: 10,
      stableLabels: { release: "stable" },
      canaryLabels: { release: "canary" },
      stickyKey: { paramType: "header", paramName: "x-user-id" },
      conditions: [
        {
          paramType: "header",
          paramName: "version",
          operator: "=",
          paramValue: "beta",
        },
      ],
    },
  };
  const render = (handle = original) => {
    ReactDOM.render(
      <CanaryRuleHandle
        ref={(ref) => {
          editor = ref;
        }}
        handle={JSON.stringify(handle)}
        dictionaries={{
          paramType: [{ dictValue: "header", dictName: "header" }],
          operator: [{ dictValue: "=", dictName: "=" }],
        }}
      />,
      container,
    );
  };
  const button = (suffix) =>
    Array.from(container.querySelectorAll("button")).find((item) =>
      item.textContent.endsWith(suffix),
    );
  const change = (suffix, value) =>
    Simulate.change(
      container.querySelector(`input[aria-label="SHENYU.CANARY.${suffix}"]`),
      { target: { value } },
    );
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });
  it("leaves legacy rules untouched until configuration is explicitly added", () => {
    render({ retry: 2 });
    expect(container.querySelectorAll("input").length).toBe(0);
    expect(editor.getData()).toEqual({ valid: true, canary: undefined });
    Simulate.click(button("ADD_CONFIG"));
    expect(editor.getData().valid).toBe(false);
    expect(container.textContent).toContain("LABELS_REQUIRED");
  });
  it("edits labels and switch locally, preserving conditions on collapse and reopen", () => {
    render();
    Simulate.click(button("CONFIG"));
    change("CANARY_LABELS SHENYU.CANARY.VALUE 1", "beta");
    Simulate.click(container.querySelector('button[role="switch"]'));
    Simulate.click(button("CONFIG"));
    Simulate.click(button("CONFIG"));
    const result = editor.getData();
    expect(result.valid).toBe(true);
    expect(result.canary.enabled).toBe(false);
    expect(result.canary.canaryLabels).toEqual({ release: "beta" });
    expect(result.canary.conditions).toEqual(original.canary.conditions);
    expect(original.canary.canaryLabels.release).toBe("canary");
  });
  it("opens the panel on validation errors and permits removing every condition", () => {
    render();
    Simulate.click(button("CONFIG"));
    change("STICKY_PARAM", "");
    Simulate.click(button("CONFIG"));
    expect(editor.getData().valid).toBe(false);
    expect(container.textContent).toContain("PARAM_REQUIRED");
    change("STICKY_PARAM", "x-user-id");
    Simulate.click(
      container.querySelector(
        'button[aria-label="SHENYU.CANARY.REMOVE_CONDITION 1"]',
      ),
    );
    expect(container.textContent).toContain("ALL_REQUESTS");
    expect(editor.getData().canary.conditions).toEqual([]);
  });
  it("discarding the modal discards the draft, and persisted values refill on reopening", () => {
    render();
    Simulate.click(button("CONFIG"));
    change("CANARY_LABELS SHENYU.CANARY.VALUE 1", "draft");
    ReactDOM.unmountComponentAtNode(container);
    render();
    expect(editor.getData()).toEqual({ valid: true, canary: undefined });
    Simulate.click(button("CONFIG"));
    expect(
      container.querySelector(
        'input[aria-label="SHENYU.CANARY.CANARY_LABELS SHENYU.CANARY.VALUE 1"]',
      ).value,
    ).toBe("canary");
  });
});
