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
import ConnectedDataPermModal from "./DataPermModal";

jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock("../../../components/_utils/utils", () => ({
  defaultNamespaceId: "A",
}));

const DataPermModal = ConnectedDataPermModal.WrappedComponent;
const plugin = (name) => ({ name, role: "0", pluginId: name });

function setup() {
  const dispatch = jest.fn();
  const ref = React.createRef();
  const view = render(
    <DataPermModal
      ref={ref}
      userId="user-1"
      dispatch={dispatch}
      global={{ plugins: [plugin("global")] }}
      resource={{
        menuTree: [
          {
            url: "/plug",
            children: ["global", "divide", "dubbo"].map((name) => ({
              name,
              meta: { icon: "api" },
              sort: 0,
            })),
          },
        ],
      }}
      namespaces={[
        { namespaceId: "A", name: "A" },
        { namespaceId: "B", name: "B" },
      ]}
    />,
  );
  function requests() {
    return dispatch.mock.calls
      .map(([action]) => action)
      .filter((action) => action.type === "global/fetchPluginsByNamespace");
  }
  function switchNamespace(key) {
    act(() => ref.current.handleNamespacesValueChange({ key }));
  }
  function respond(index, name) {
    const { callback } = requests()[index].payload;
    expect(callback).toEqual(expect.any(Function));
    act(() => callback([plugin(name)]));
  }
  return { ...view, requests, switchNamespace, respond, dispatch, ref };
}

it("displays its own namespace plugins and discards delayed responses", () => {
  const modal = setup();
  expect(screen.queryByText("Global")).toBeNull();
  expect(modal.requests()[0].payload.namespaceId).toBe("A");
  modal.switchNamespace("B");
  modal.respond(1, "dubbo");
  expect(screen.getByText("Dubbo")).toBeTruthy();
  modal.respond(0, "divide");
  expect(screen.queryByText("Divide")).toBeNull();
  expect(screen.getByText("Dubbo")).toBeTruthy();
});

it("clears the previous plugin list when switching namespaces", () => {
  const modal = setup();
  modal.respond(0, "divide");
  expect(screen.getByText("Divide")).toBeTruthy();
  modal.switchNamespace("B");
  expect(screen.queryByText("Divide")).toBeNull();
  modal.switchNamespace("A");
  modal.respond(2, "dubbo");
  modal.respond(1, "divide");
  expect(screen.queryByText("Divide")).toBeNull();
  expect(screen.getByText("Dubbo")).toBeTruthy();
});

it("ignores plugin responses after the modal is unmounted", () => {
  const modal = setup();
  const { callback } = modal.requests()[0].payload;
  expect(callback).toEqual(expect.any(Function));
  const error = jest.spyOn(console, "error").mockImplementation(() => {});
  modal.unmount();
  act(() => callback([plugin("divide")]));
  expect(error).not.toHaveBeenCalled();
});

it("ignores an earlier response from the same namespace after switching back", () => {
  const modal = setup();
  modal.switchNamespace("B");
  modal.switchNamespace("A");
  modal.respond(2, "dubbo");
  modal.respond(0, "divide");
  expect(screen.queryByText("Divide")).toBeNull();
  expect(screen.getByText("Dubbo")).toBeTruthy();
});

function loadSelectors(modal) {
  act(() =>
    modal.ref.current.setState({ currentPlugin: { pluginId: "divide" } }),
  );
  act(() => modal.ref.current.getPermissionSelectorList(1));
  return modal.dispatch.mock.calls
    .map(([action]) => action)
    .filter(
      (action) => action.type === "dataPermission/fetchDataPermisionSelectors",
    );
}
it("ignores selector results after switching namespaces", () => {
  const modal = setup();
  const request = loadSelectors(modal)[0];
  modal.switchNamespace("B");
  act(() =>
    request.callback({
      total: 1,
      dataList: [{ dataId: "old", dataName: "Old selector", isChecked: true }],
    }),
  );
  expect(modal.ref.current.state.selectorData).toBeNull();
});
it("keeps the newest selector page when replies arrive backwards", () => {
  const modal = setup();
  const first = loadSelectors(modal)[0];
  act(() => modal.ref.current.selectorPageOnchange(2));
  const latest = modal.dispatch.mock.calls
    .map(([a]) => a)
    .filter((a) => a.type === "dataPermission/fetchDataPermisionSelectors")
    .pop();
  act(() =>
    latest.callback({
      total: 20,
      dataList: [{ dataId: "new", dataName: "New selector" }],
    }),
  );
  act(() =>
    first.callback({
      total: 20,
      dataList: [{ dataId: "old", dataName: "Old selector" }],
    }),
  );
  expect(modal.ref.current.state.selectorData.dataList[0].dataId).toBe("new");
});
it("ignores a grant completion after the namespace changes", () => {
  const modal = setup();
  loadSelectors(modal);
  act(() =>
    modal.ref.current.handleCheckSelector({ dataId: "s1", isChecked: false }),
  );
  const mutation = modal.dispatch.mock.calls
    .map(([a]) => a)
    .find((a) => a.type === "dataPermission/addPermisionSelector");
  expect(mutation.payload).toEqual({ dataId: "s1", userId: "user-1" });
  modal.switchNamespace("B");
  const count = modal.dispatch.mock.calls.length;
  expect(() => act(() => mutation.callback())).not.toThrow();
  expect(modal.dispatch.mock.calls).toHaveLength(count);
});

const actions = (modal) => modal.dispatch.mock.calls.map(([action]) => action);
it("selects only plugin leaves and sends exact selector/rule grant identities", () => {
  const modal = setup();
  modal.respond(0, "divide");
  fireEvent.click(screen.getByText("0"));
  expect(
    actions(modal).some(
      (a) => a.type === "dataPermission/fetchDataPermisionSelectors",
    ),
  ).toBe(false);
  fireEvent.click(screen.getByText("Divide"));
  const request = actions(modal).find(
    (a) => a.type === "dataPermission/fetchDataPermisionSelectors",
  );
  expect(request.payload).toMatchObject({
    pluginId: "divide",
    namespaceId: "A",
    userId: "user-1",
  });
  act(() =>
    request.callback({
      total: 1,
      dataList: [
        { dataId: "s1", dataName: "Selector fixture", isChecked: false },
      ],
    }),
  );
  fireEvent.click(screen.getByRole("checkbox", { name: "Selector fixture" }));
  expect(
    actions(modal).find((a) => a.type === "dataPermission/addPermisionSelector")
      .payload,
  ).toEqual({ userId: "user-1", dataId: "s1" });
  act(() => modal.ref.current.handleExpandRuleTable(true, { dataId: "s1" }));
  const rules = actions(modal).find(
    (a) => a.type === "dataPermission/fetchDataPermisionRules",
  );
  act(() =>
    rules.callback({
      total: 1,
      dataList: [{ dataId: "r1", dataName: "Rule fixture", isChecked: true }],
    }),
  );
  fireEvent.click(screen.getByRole("checkbox", { name: "Rule fixture" }));
  expect(
    actions(modal).find((a) => a.type === "dataPermission/deletePermisionRule")
      .payload,
  ).toEqual({ userId: "user-1", dataId: "r1" });
});
it("keeps independently expanded rule lists and ignores out-of-order pages", () => {
  const modal = setup();
  loadSelectors(modal);
  act(() => {
    modal.ref.current.getPermissionRuleList("s1", 1);
    modal.ref.current.getPermissionRuleList("s2", 1);
    modal.ref.current.getPermissionRuleList("s1", 2);
  });
  const requests = actions(modal).filter(
    (a) => a.type === "dataPermission/fetchDataPermisionRules",
  );
  const response = (id) => ({
    total: 20,
    dataList: [{ dataId: id, dataName: id, isChecked: false }],
  });
  act(() => {
    requests[2].callback(response("new"));
    requests[1].callback(response("other"));
    requests[0].callback(response("old"));
  });
  expect(modal.ref.current.state.ruleListMap.s1).toMatchObject({
    currentRulePage: 2,
    dataList: [{ dataId: "new", selectorId: "s1" }],
  });
  expect(modal.ref.current.state.ruleListMap.s2.dataList[0].dataId).toBe(
    "other",
  );
});
it("does not reuse a rule request token after collapse and re-expansion", () => {
  const modal = setup();
  loadSelectors(modal);
  act(() => modal.ref.current.handleExpandRuleTable(true, { dataId: "s1" }));
  const old = actions(modal)
    .filter((a) => a.type === "dataPermission/fetchDataPermisionRules")
    .pop();
  act(() => {
    modal.ref.current.handleExpandRuleTable(false, { dataId: "s1" });
    modal.ref.current.handleExpandRuleTable(true, { dataId: "s1" });
  });
  act(() => old.callback({ total: 1, dataList: [{ dataId: "stale" }] }));
  expect(modal.ref.current.state.ruleListMap.s1).toBeUndefined();
});

it("reloads the target user and ignores the previous user's selector response", () => {
  const modal = setup();
  const old = loadSelectors(modal)[0];
  const props = modal.ref.current.props;
  modal.rerender(<DataPermModal {...props} userId="user-2" ref={modal.ref} />);
  const latest = actions(modal)
    .filter((a) => a.type === "dataPermission/fetchDataPermisionSelectors")
    .pop();
  expect(latest.payload.userId).toBe("user-2");
  act(() => {
    latest.callback({
      total: 1,
      dataList: [{ dataId: "new-user", dataName: "New user data" }],
    });
    old.callback({ total: 1, dataList: [{ dataId: "old-user" }] });
  });
  expect(modal.ref.current.state.selectorData.dataList[0].dataId).toBe(
    "new-user",
  );
});
it("does not update local permission state after unmount", () => {
  const modal = setup();
  const selectors = loadSelectors(modal)[0];
  act(() => modal.ref.current.getPermissionRuleList("s1", 1));
  const rules = actions(modal)
    .filter((a) => a.type === "dataPermission/fetchDataPermisionRules")
    .pop();
  const setState = jest.spyOn(modal.ref.current, "setState");
  modal.unmount();
  setState.mockClear();
  act(() => {
    selectors.callback({ total: 0, dataList: [] });
    rules.callback({ total: 0, dataList: [] });
  });
  expect(setState).not.toHaveBeenCalled();
});
