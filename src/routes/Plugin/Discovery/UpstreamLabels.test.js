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
import EditableFormTable from "./DiscoveryUpstreamTable";

jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));

describe("unified upstream editing", () => {
  let container;
  let data;
  let onTableChange;
  let onEditingChange;
  const render = () => {
    ReactDOM.render(
      <EditableFormTable
        dataSource={data}
        isLocal
        recordCount={1}
        onCountChange={() => {}}
        onTableChange={onTableChange}
        onEditingChange={onEditingChange}
      />,
      container,
    );
  };
  const click = (suffix) =>
    Simulate.click(
      Array.from(container.querySelectorAll("button")).find((button) =>
        button.textContent.endsWith(suffix),
      ),
    );
  const change = (selector, value) =>
    Simulate.change(container.querySelector(selector), { target: { value } });
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    data = [
      {
        key: "one",
        protocol: "http://",
        url: "127.0.0.1:8080",
        status: 0,
        weight: 50,
        startupTime: 0,
        warmupTime: 10,
        gray: false,
        props:
          '{"labels":{"release":"stable","region":"cn","team":"gateway"},"custom":{"tls":true}}',
      },
    ];
    onTableChange = jest.fn((next) => {
      data = next;
      render();
    });
    onEditingChange = jest.fn();
    render();
  });
  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });
  it("shows a separate readonly label column with two tags and overflow", () => {
    expect(
      Array.from(container.querySelectorAll("th")).some(
        (th) => th.textContent === "SHENYU.UPSTREAM.LABELS.TITLE",
      ),
    ).toBe(true);
    expect(container.querySelectorAll(".ant-tag").length).toBe(2);
    expect(container.textContent).toContain("+1");
    expect(container.querySelectorAll("input").length).toBe(0);
    expect(
      container.querySelectorAll(
        'button[aria-label="SHENYU.UPSTREAM.LABELS.VIEW_ALL"]',
      ).length,
    ).toBe(1);
  });
  it("saves base fields and labels together while preserving unrelated props", () => {
    click("UPSTREAM.EDIT");
    expect(onEditingChange).toHaveBeenLastCalledWith(true);
    change('input[id="url"]', "127.0.0.1:8081");
    change('input[aria-label="SHENYU.UPSTREAM.LABELS.VALUE 1"]', "canary");
    expect(onTableChange).not.toHaveBeenCalled();
    click("UPSTREAM.SAVE");
    expect(onTableChange).toHaveBeenCalledTimes(1);
    expect(data[0].url).toBe("127.0.0.1:8081");
    expect(JSON.parse(data[0].props)).toEqual({
      labels: { release: "canary", region: "cn", team: "gateway" },
      custom: { tls: true },
    });
    expect(container.querySelectorAll("input").length).toBe(0);
    expect(onEditingChange).toHaveBeenLastCalledWith(false);
  });
  it("discards both drafts on cancel and restores values on reopening", () => {
    click("UPSTREAM.EDIT");
    change('input[id="url"]', "discard-me:8081");
    change('input[aria-label="SHENYU.UPSTREAM.LABELS.VALUE 1"]', "canary");
    click("UPSTREAM.CANCEL");
    expect(onTableChange).not.toHaveBeenCalled();
    click("UPSTREAM.EDIT");
    expect(container.querySelector('input[id="url"]').value).toBe(
      "127.0.0.1:8080",
    );
    expect(
      container.querySelector(
        'input[aria-label="SHENYU.UPSTREAM.LABELS.VALUE 1"]',
      ).value,
    ).toBe("stable");
  });
  it("blocks the entire save on blank or duplicate label keys", () => {
    click("UPSTREAM.EDIT");
    change('input[id="url"]', "127.0.0.1:8081");
    click("LABELS.ADD");
    click("UPSTREAM.SAVE");
    expect(onTableChange).not.toHaveBeenCalled();
    expect(container.textContent).toContain("LABELS.REQUIRED");
    change('input[aria-label="SHENYU.UPSTREAM.LABELS.KEY 4"]', "release");
    change('input[aria-label="SHENYU.UPSTREAM.LABELS.VALUE 4"]', "canary");
    click("UPSTREAM.SAVE");
    expect(onTableChange).not.toHaveBeenCalled();
    expect(container.textContent).toContain("LABELS.DUPLICATE");
  });
  it("clears all labels explicitly when the row is saved", () => {
    click("UPSTREAM.EDIT");
    while (
      container.querySelector('button[title="SHENYU.UPSTREAM.LABELS.REMOVE"]')
    ) {
      Simulate.click(
        container.querySelector(
          'button[title="SHENYU.UPSTREAM.LABELS.REMOVE"]',
        ),
      );
    }
    click("UPSTREAM.SAVE");
    expect(JSON.parse(data[0].props)).toEqual({
      labels: {},
      custom: { tls: true },
    });
    expect(container.textContent).toContain("LABELS.EMPTY");
  });
  it("does not add labels when saving an untouched legacy instance", () => {
    data[0].props = '{"custom":{"tls":true}}';
    render();
    click("UPSTREAM.EDIT");
    click("UPSTREAM.SAVE");
    expect(JSON.parse(data[0].props)).toEqual({ custom: { tls: true } });
  });
});
