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
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  within,
} from "@testing-library/react";
import HomeConnected from "./index";
import { routerRedux } from "../../runtime/router";
import {
  activePluginSnapshotByNamespace,
  getNewEventRecodLogList,
} from "../../services/api";

jest.mock("../../services/api", () => ({
  activePluginSnapshotByNamespace: jest.fn(),
  getNewEventRecodLogList: jest.fn(),
}));
jest.mock("../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
const Home = HomeConnected.WrappedComponent;
const plugin = (name) => ({
  name,
  role: "Proxy",
  handleCount: 0,
  selectorCount: 2,
  config: '{"timeout":0}',
});
const log = {
  operationTime: "2026-11-14",
  operationType: "CREATE_RULE",
  operator: "tester",
  context: "Created a temporary rule",
};
beforeEach(() => {
  window.sessionStorage.setItem("token", "test-token");
  window.sessionStorage.setItem("currentNamespaceId", "ns-A");
  activePluginSnapshotByNamespace
    .mockReset()
    .mockResolvedValue({ code: 200, data: [plugin("divide")] });
  getNewEventRecodLogList
    .mockReset()
    .mockResolvedValue({ code: 200, data: [log] });
});
afterEach(() => window.sessionStorage.clear());
const summary = (key) =>
  within(screen.getByRole("group", { name: `SHENYU.HOME.${key}` }));

it("distinguishes loading summaries from a successful empty response", async () => {
  let resolveSnapshot, resolveLogs;
  activePluginSnapshotByNamespace.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveSnapshot = resolve;
      }),
  );
  getNewEventRecodLogList.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveLogs = resolve;
      }),
  );
  render(<Home dispatch={jest.fn()} global={{ currentNamespaceId: "ns-A" }} />);
  ["ACTIVE_PLUGINS", "ACTIVE_SELECTORS", "RECENT_EVENTS"].forEach((key) => {
    expect(summary(key).getByText("SHENYU.HOME.LOADING")).toBeTruthy();
    expect(summary(key).queryByText("0")).toBeNull();
  });
  await act(async () => {
    resolveSnapshot({ code: 200, data: [] });
    resolveLogs({ code: 200, data: [] });
  });
  ["ACTIVE_PLUGINS", "ACTIVE_SELECTORS", "RECENT_EVENTS"].forEach((key) => {
    expect(summary(key).getByText("0")).toBeTruthy();
    expect(summary(key).queryByText("SHENYU.HOME.LOADING")).toBeNull();
  });
});

it("derives summaries from the loaded snapshot and recent records", async () => {
  activePluginSnapshotByNamespace.mockResolvedValue({
    code: 200,
    data: [plugin("divide"), { ...plugin("dubbo"), selectorCount: 3 }],
  });
  getNewEventRecodLogList.mockResolvedValue({
    code: 200,
    data: [log, { ...log, id: "other" }],
  });
  window.sessionStorage.setItem("userName", "dashboard-user");
  render(
    <Home
      dispatch={jest.fn()}
      global={{
        currentNamespaceId: "ns-A",
        namespaces: [{ namespaceId: "ns-A", name: "Team A" }],
      }}
    />,
  );
  expect(await summary("ACTIVE_PLUGINS").findByText("2")).toBeTruthy();
  expect(summary("ACTIVE_SELECTORS").getByText("5")).toBeTruthy();
  expect(summary("RECENT_EVENTS").getByText("2")).toBeTruthy();
  expect(screen.getByText("dashboard-user")).toBeTruthy();
  expect(screen.getByText("Team A")).toBeTruthy();
});

it("keeps failed summaries unavailable while independently successful data remains visible", async () => {
  activePluginSnapshotByNamespace.mockRejectedValue(new Error("offline"));
  render(<Home dispatch={jest.fn()} global={{ currentNamespaceId: "ns-A" }} />);
  expect(
    await summary("ACTIVE_PLUGINS").findByText("SHENYU.HOME.UNAVAILABLE"),
  ).toBeTruthy();
  expect(
    summary("ACTIVE_SELECTORS").getByText("SHENYU.HOME.UNAVAILABLE"),
  ).toBeTruthy();
  expect(summary("ACTIVE_PLUGINS").queryByText("0")).toBeNull();
  expect(summary("RECENT_EVENTS").getByText("1")).toBeTruthy();
});

it("does not turn missing selector counts into a successful zero", async () => {
  activePluginSnapshotByNamespace.mockResolvedValue({
    code: 200,
    data: [{ name: "divide", role: "Proxy", handleCount: 0 }],
  });
  render(<Home dispatch={jest.fn()} global={{ currentNamespaceId: "ns-A" }} />);
  expect(await summary("ACTIVE_PLUGINS").findByText("1")).toBeTruthy();
  expect(
    summary("ACTIVE_SELECTORS").getByText("SHENYU.HOME.UNAVAILABLE"),
  ).toBeTruthy();
});
it("loads the current namespace and displays the plugin/log overview", async () => {
  const dispatch = jest.fn();
  render(<Home dispatch={dispatch} global={{ currentNamespaceId: "ns-A" }} />);
  expect(await screen.findByText("divide", { exact: true })).toBeTruthy();
  expect(activePluginSnapshotByNamespace).toHaveBeenCalledWith({
    namespaceId: "ns-A",
  });
  expect(getNewEventRecodLogList).toHaveBeenCalledTimes(1);
  expect(dispatch).toHaveBeenCalledWith({ type: "global/fetchPlatform" });
  expect(screen.getByText("CREATE_RULE")).toBeTruthy();
  expect(screen.getByText("tester")).toBeTruthy();
});
it("navigates to the selected plugin's absolute route", async () => {
  const dispatch = jest.fn();
  render(<Home dispatch={dispatch} global={{ currentNamespaceId: "ns-A" }} />);
  fireEvent.click(await screen.findByText("divide", { exact: true }));
  expect(dispatch).toHaveBeenCalledWith(routerRedux.push("/plug/Proxy/divide"));
});
it("refreshes namespace snapshots and ignores the older response", async () => {
  const replies = [];
  activePluginSnapshotByNamespace.mockImplementation(
    () =>
      new Promise((resolve) => {
        replies.push(resolve);
      }),
  );
  const props = { dispatch: jest.fn(), global: { currentNamespaceId: "ns-A" } };
  const view = render(<Home {...props} />);
  view.rerender(<Home {...props} global={{ currentNamespaceId: "ns-B" }} />);
  expect(
    summary("ACTIVE_PLUGINS").getByText("SHENYU.HOME.LOADING"),
  ).toBeTruthy();
  await waitFor(() =>
    expect(activePluginSnapshotByNamespace).toHaveBeenCalledTimes(2),
  );
  await act(async () => replies[1]({ code: 200, data: [plugin("dubbo")] }));
  await act(async () => replies[0]({ code: 200, data: [plugin("divide")] }));
  expect(screen.getByText("dubbo", { exact: true })).toBeTruthy();
  expect(screen.queryByText("divide", { exact: true })).toBeNull();
  expect(summary("ACTIVE_PLUGINS").getByText("1")).toBeTruthy();
  expect(summary("ACTIVE_SELECTORS").getByText("2")).toBeTruthy();
});
it("opens and closes event details through a native button", async () => {
  render(<Home dispatch={jest.fn()} global={{ currentNamespaceId: "ns-A" }} />);
  const detail = await screen.findByRole("button", {
    name: /CREATE_RULE.*tester.*Detail/,
  });
  fireEvent.click(detail);
  expect(screen.getByText(log.context)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  expect(screen.queryByText(log.context)).toBeNull();
});
it("keeps invalid configuration readable instead of crashing the overview", async () => {
  activePluginSnapshotByNamespace.mockResolvedValue({
    code: 200,
    data: [{ ...plugin("divide"), config: "invalid config" }],
  });
  render(<Home dispatch={jest.fn()} global={{ currentNamespaceId: "ns-A" }} />);
  const button = await screen.findByRole("button", { name: "divide" });
  fireEvent.mouseOver(button);
  expect(await screen.findByText("invalid config")).toBeTruthy();
});
it("shows independent request failures instead of a successful empty overview", async () => {
  activePluginSnapshotByNamespace.mockRejectedValue(new Error("offline"));
  getNewEventRecodLogList.mockResolvedValue({
    code: 500,
    data: { reason: "offline" },
  });
  render(<Home dispatch={jest.fn()} global={{ currentNamespaceId: "ns-A" }} />);
  expect(
    await screen.findByText("Unable to load active plugins."),
  ).toBeTruthy();
  expect(await screen.findByText("Unable to load event logs.")).toBeTruthy();
  expect(
    summary("RECENT_EVENTS").getByText("SHENYU.HOME.UNAVAILABLE"),
  ).toBeTruthy();
  expect(summary("RECENT_EVENTS").queryByText("0")).toBeNull();
});
it("ignores delayed requests after unmount without replacing setState", async () => {
  let resolveSnapshot, resolveLogs;
  activePluginSnapshotByNamespace.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveSnapshot = resolve;
      }),
  );
  getNewEventRecodLogList.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveLogs = resolve;
      }),
  );
  const ref = React.createRef();
  const view = render(
    <Home
      ref={ref}
      dispatch={jest.fn()}
      global={{ currentNamespaceId: "ns-A" }}
    />,
  );
  const instance = ref.current;
  const setter = jest.spyOn(instance, "setState");
  view.unmount();
  await act(async () => {
    resolveSnapshot({ code: 200, data: [plugin("late")] });
    resolveLogs({ code: 200, data: [log] });
  });
  expect(instance.setState).toBe(setter);
  expect(setter).not.toHaveBeenCalled();
});
it("discards a stale failure after switching away and back", async () => {
  const pending = [];
  activePluginSnapshotByNamespace.mockImplementation(
    () =>
      new Promise((resolve, reject) => {
        pending.push({ resolve, reject });
      }),
  );
  const props = { dispatch: jest.fn(), global: { currentNamespaceId: "ns-A" } };
  const view = render(<Home {...props} />);
  view.rerender(<Home {...props} global={{ currentNamespaceId: "ns-B" }} />);
  view.rerender(<Home {...props} />);
  await act(async () =>
    pending[2].resolve({ code: 200, data: [plugin("newest")] }),
  );
  await act(async () => pending[0].reject(new Error("old")));
  expect(screen.getByRole("button", { name: "newest" })).toBeTruthy();
  expect(screen.queryByText("Unable to load active plugins.")).toBeNull();
});
