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
  within,
  waitFor,
} from "@testing-library/react";
import * as echarts from "echarts";
import ConnectedInstance from "./index";

jest.mock("echarts", () => ({ init: jest.fn() }));
jest.mock(
  "../../../utils/AuthButton",
  () =>
    ({ children }) =>
      typeof children === "function" ? children({}) : children,
);
jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
  getCurrentLocale: jest.fn(),
}));
const Instance = ConnectedInstance.WrappedComponent;
const records = [
  {
    id: "node-1",
    key: "node-1",
    instanceIp: "127.0.0.1",
    instancePort: 9195,
    instanceType: "bootstrap",
    instanceInfo: '{"version":"test"}',
    instanceState: 1,
    dateCreated: "2026-11-14",
    lastHeartBeatTime: "2026-11-14",
  },
];
function setup() {
  const dispatch = jest.fn();
  const charts = [];
  echarts.init.mockImplementation(() => {
    const chart = {
      resize: jest.fn(),
      dispose: jest.fn(),
      setOption: jest.fn(),
    };
    charts.push(chart);
    return chart;
  });
  const props = {
    dispatch,
    language: "en-US",
    currentNamespaceId: "ns-1",
    instance: { instanceList: records, total: 30, pieData: [], lineData: [] },
    loading: false,
  };
  const view = render(<Instance {...props} />);
  return { ...view, dispatch, charts, props };
}
it("loads list and analysis for the active namespace", () => {
  const { dispatch } = setup();
  expect(dispatch).toHaveBeenCalledWith({
    type: "instance/fetch",
    payload: {
      instanceIp: "",
      instanceType: null,
      currentPage: 1,
      pageSize: 12,
      namespaceId: "ns-1",
    },
  });
  expect(dispatch).toHaveBeenCalledWith({
    type: "instance/fetchAnalysis",
    payload: { namespaceId: "ns-1" },
  });
});
it("filters IP on page one and selects without fetching", () => {
  const { dispatch } = setup();
  dispatch.mockClear();
  fireEvent.change(screen.getByPlaceholderText("SHENYU.INSTANCE.IP"), {
    target: { value: "127" },
  });
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch.mock.calls[0][0].payload).toEqual(
    expect.objectContaining({
      instanceIp: "127",
      currentPage: 1,
      namespaceId: "ns-1",
    }),
  );
  dispatch.mockClear();
  fireEvent.click(
    within(
      screen.getByText("127.0.0.1", { exact: true }).closest("tr"),
    ).getByRole("checkbox"),
  );
  expect(dispatch).not.toHaveBeenCalled();
});
it("requests the next page once", () => {
  const { dispatch } = setup();
  dispatch.mockClear();
  fireEvent.click(
    screen.queryByTitle("Next Page") || screen.getByLabelText("Next"),
  );
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch.mock.calls[0][0].payload.currentPage).toBe(2);
});
it("updates chart data, resizes and disposes mounted charts", () => {
  const { charts, rerender, props, unmount } = setup();
  rerender(
    <Instance
      {...props}
      instance={{
        ...props.instance,
        pieData: [{ name: "bootstrap", value: 1 }],
        lineData: [{ name: "bootstrap", data: [1, 2] }],
      }}
    />,
  );
  expect(charts[0].setOption).toHaveBeenCalledWith(
    expect.objectContaining({
      series: [
        expect.objectContaining({ data: [{ name: "bootstrap", value: 1 }] }),
      ],
    }),
  );
  expect(charts[1].setOption).toHaveBeenCalledWith(
    expect.objectContaining({
      series: [{ name: "bootstrap", type: "line", data: [1, 2] }],
    }),
    { replaceMerge: ["series"] },
  );
  fireEvent(window, new Event("resize"));
  charts.forEach((chart) => expect(chart.resize).toHaveBeenCalledTimes(1));
  unmount();
  charts.forEach((chart) => expect(chart.dispose).toHaveBeenCalledTimes(1));
  fireEvent(window, new Event("resize"));
  charts.forEach((chart) => expect(chart.resize).toHaveBeenCalledTimes(1));
});
it("refreshes both list and charts and clears paging/selection on namespace change", () => {
  const { dispatch, rerender, props } = setup();
  fireEvent.click(
    screen.queryByTitle("Next Page") || screen.getByLabelText("Next"),
  );
  fireEvent.click(
    within(
      screen.getByText("127.0.0.1", { exact: true }).closest("tr"),
    ).getByRole("checkbox"),
  );
  dispatch.mockClear();
  rerender(<Instance {...props} currentNamespaceId="ns-2" />);
  expect(dispatch).toHaveBeenCalledWith({
    type: "instance/fetchAnalysis",
    payload: { namespaceId: "ns-2" },
  });
  expect(dispatch).toHaveBeenCalledWith({
    type: "instance/fetch",
    payload: expect.objectContaining({ namespaceId: "ns-2", currentPage: 1 }),
  });
  expect(
    within(
      screen.getByText("127.0.0.1", { exact: true }).closest("tr"),
    ).getByRole("checkbox").checked,
  ).toBe(false);
});

it("changes page size once while retaining namespace and filters", async () => {
  const { dispatch } = setup();
  fireEvent.change(screen.getByPlaceholderText("SHENYU.INSTANCE.IP"), {
    target: { value: "127" },
  });
  fireEvent.click(screen.getByLabelText("Next"));
  dispatch.mockClear();
  fireEvent.click(screen.getByText("Items per page: 12", { exact: true }));
  const option = await screen.findByRole("option", {
    name: /Items per page: 20$/,
  });
  fireEvent.click(option);
  fireEvent.animationEnd(option.closest("[x-placement]"));
  await waitFor(() => expect(dispatch).toHaveBeenCalledTimes(1));
  expect(dispatch).toHaveBeenCalledWith({
    type: "instance/fetch",
    payload: expect.objectContaining({
      currentPage: 1,
      pageSize: 20,
      namespaceId: "ns-1",
      instanceIp: "127",
    }),
  });
});
it("observes chart containers and disconnects on unmount", () => {
  const original = window.ResizeObserver;
  const observers = [];
  window.ResizeObserver = jest.fn().mockImplementation((callback) => {
    const observer = { callback, observe: jest.fn(), disconnect: jest.fn() };
    observers.push(observer);
    return observer;
  });
  try {
    const { charts, unmount } = setup();
    const observer = observers.find((item) =>
      item.observe.mock.calls.some(([node]) => node.id === "pieDataDiv"),
    );
    expect(observer).toBeTruthy();
    expect(observer.observe).toHaveBeenCalledWith(
      document.getElementById("lineDataDiv"),
    );
    observer.callback();
    charts.forEach((chart) => expect(chart.resize).toHaveBeenCalledTimes(1));
    unmount();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  } finally {
    window.ResizeObserver = original;
  }
});
