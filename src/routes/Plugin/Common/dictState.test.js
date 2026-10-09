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
import { Form } from "antd";
import ConnectedSelector from "./Selector";
import ConnectedRule from "./Rule";

let importModalProps;

jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
}));
jest.mock("./SelectorCopy", () => () => null);
jest.mock("./RuleCopy", () => () => null);
jest.mock("../Discovery/DiscoveryUpstreamTable.js", () => () => null);
jest.mock("../Discovery/DiscoveryImportModal", () => (props) => {
  importModalProps = props;
  return null;
});

// Form.create() hoists the class unwrapped by dva connect(), so the modal can be
// mounted with a real form but without a store.
const unwrap = (component) => Form.create()(component.WrappedComponent);
const Selector = unwrap(ConnectedSelector);
const Rule = unwrap(ConnectedRule);

beforeEach(() => {
  importModalProps = undefined;
});

const matchModeDics = [
  { dictValue: "0", dictName: "and" },
  { dictValue: "1", dictName: "or" },
];

// Hold dictionary requests until the test resolves them, like a slow backend.
const createDispatch = () => {
  const pending = {};
  const dispatch = jest.fn(({ type, payload }) => {
    if (type === "shenyuDict/fetchByType") {
      pending[payload.type] = payload.callBack;
    }
  });
  const resolve = (type, dics) => {
    if (typeof pending[type] !== "function") {
      throw new Error(`no dictionary request registered for "${type}"`);
    }
    act(() => pending[type](dics));
  };
  return { dispatch, resolve };
};

const matchModeSelection = () =>
  document.querySelector("#matchMode .ant-select-selection-selected-value")
    .textContent;

describe("dictionary responses that arrive after mount", () => {
  it("re-render Selector options", () => {
    const { dispatch, resolve } = createDispatch();
    render(
      <Selector
        dispatch={dispatch}
        platform={{ selectorTypeEnums: [] }}
        discovery={{ typeEnums: ["local", "zookeeper", "nacos"] }}
        pluginId="5"
        matchMode={0}
        type={1}
        onCancel={jest.fn()}
        handleOk={jest.fn()}
      />,
    );

    expect(matchModeSelection()).toBe("0");
    resolve("matchMode", matchModeDics);
    expect(matchModeSelection()).toBe("and");
  });

  it("re-render Rule options", () => {
    const { dispatch, resolve } = createDispatch();
    render(
      <Rule
        dispatch={dispatch}
        pluginId="5"
        pluginName="divide"
        matchMode={0}
        onCancel={jest.fn()}
        handleOk={jest.fn()}
      />,
    );

    expect(matchModeSelection()).toBe("0");
    resolve("matchMode", matchModeDics);
    expect(matchModeSelection()).toBe("and");
  });
});
describe("cached dictionaries", () => {
  it("are applied when Rule receives them synchronously", () => {
    const dispatch = ({ type, payload }) => {
      if (type === "shenyuDict/fetchByType" && payload.type === "matchMode") {
        payload.callBack(matchModeDics);
      }
    };
    render(
      <Rule
        dispatch={dispatch}
        pluginId="5"
        pluginName="divide"
        matchMode={0}
        onCancel={jest.fn()}
        handleOk={jest.fn()}
      />,
    );

    expect(matchModeSelection()).toBe("and");
  });
});

describe("Selector discovery import", () => {
  it("renders the imported properties and their values", () => {
    const { dispatch, resolve } = createDispatch();
    render(
      <Selector
        dispatch={dispatch}
        platform={{ selectorTypeEnums: [] }}
        discovery={{ typeEnums: ["local", "zookeeper", "nacos"] }}
        pluginId="5"
        type={1}
        isDiscovery
        isAdd
        discoveryConfig={{ discoveryType: "local" }}
        onCancel={jest.fn()}
        handleOk={jest.fn()}
      />,
    );
    resolve("discoveryMode", [
      { dictName: "zookeeper", dictValue: '{"sessionTimeout":"1000"}' },
    ]);
    fireEvent.click(
      screen.getByText("SHENYU.DISCOVERY.SELECTOR.CONFIG.DISCOVERY"),
    );
    expect(importModalProps && importModalProps.onOk).toBeInstanceOf(Function);
    const importConfig = (props) =>
      act(() =>
        importModalProps.onOk({
          type: "nacos",
          serverList: "127.0.0.1:8848",
          id: "discovery-1",
          props,
        }),
      );

    importConfig('{"groupName":"FIRST"}');
    expect(screen.getByDisplayValue("FIRST")).toBeTruthy();
    fireEvent.change(screen.getByDisplayValue("FIRST"), {
      target: { value: "EDITED" },
    });

    importConfig('{"namespace":"public","groupName":"SECOND"}');
    expect(screen.queryByText("sessionTimeout")).toBeNull();
    expect(screen.getByText("namespace")).toBeTruthy();
    expect(screen.getByDisplayValue("public")).toBeTruthy();
    expect(screen.getByDisplayValue("SECOND")).toBeTruthy();
    expect(screen.getByDisplayValue("127.0.0.1:8848")).toBeTruthy();
  });

  it("keeps the modal state consistent when props is malformed JSON", () => {
    const { dispatch, resolve } = createDispatch();
    render(
      <Selector
        dispatch={dispatch}
        platform={{ selectorTypeEnums: [] }}
        discovery={{ typeEnums: ["local", "zookeeper", "nacos"] }}
        pluginId="5"
        type={1}
        isDiscovery
        isAdd
        discoveryConfig={{ discoveryType: "local" }}
        onCancel={jest.fn()}
        handleOk={jest.fn()}
      />,
    );
    resolve("discoveryMode", []);
    fireEvent.click(
      screen.getByText("SHENYU.DISCOVERY.SELECTOR.CONFIG.DISCOVERY"),
    );
    expect(importModalProps && importModalProps.onOk).toBeInstanceOf(Function);
    expect(() =>
      act(() =>
        importModalProps.onOk({
          type: "nacos",
          serverList: "127.0.0.1:8848",
          id: "discovery-1",
          props: "{not json",
        }),
      ),
    ).not.toThrow();
    expect(screen.getByDisplayValue("127.0.0.1:8848")).toBeTruthy();
  });
});
