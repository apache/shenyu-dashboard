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

import ConnectedInstance from "./index";

jest.mock("echarts", () => ({ init: jest.fn() }));
jest.mock(
  "../../../utils/AuthButton",
  () =>
    ({ children }) =>
      children,
);
jest.mock("../../../utils/IntlUtils", () => ({
  getCurrentLocale: jest.fn(),
  getIntlContent: (key) => key,
}));

const Instance = ConnectedInstance.WrappedComponent;

it("refreshes the table and the analysis when the namespace changes", () => {
  const dispatch = jest.fn();
  const instance = { pieData: [], lineData: [] };
  const prevProps = {
    dispatch,
    instance,
    language: "en-US",
    currentNamespaceId: "namespace-a",
  };
  const component = new Instance({
    ...prevProps,
    currentNamespaceId: "namespace-b",
  });

  component.componentDidUpdate(prevProps);

  expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
    {
      type: "instance/fetch",
      payload: expect.objectContaining({ namespaceId: "namespace-b" }),
    },
    {
      type: "instance/fetchAnalysis",
      payload: { namespaceId: "namespace-b" },
    },
  ]);
});

describe("chart rendering after the analysis is cleared", () => {
  let echarts;
  let component;
  let pieDiv;
  let lineDiv;

  beforeAll(() => {
    // ECharts has no getter to restore its platform API, so change it on a
    // private copy that no other test can see.
    jest.isolateModules(() => {
      echarts = jest.requireActual("echarts");
    });
    // jsdom has no canvas, so let ECharts estimate text widths instead.
    echarts.setPlatformAPI({ createCanvas: () => null });
  });

  beforeEach(() => {
    const options = { renderer: "svg", width: 800, height: 400 };
    pieDiv = document.createElement("div");
    lineDiv = document.createElement("div");
    component = new Instance({
      dispatch: jest.fn(),
      instance: { pieData: [], lineData: [] },
      language: "en-US",
    });
    component.pieChartInstance = echarts.init(pieDiv, null, options);
    component.lineChartInstance = echarts.init(lineDiv, null, options);
  });

  afterEach(() => {
    component.pieChartInstance.dispose();
    component.lineChartInstance.dispose();
  });

  it("shows a placeholder for empty chart data", () => {
    component.renderPieChart([]);
    component.renderLineChart([]);

    const [pie] = component.pieChartInstance.getOption().series;
    const [line] = component.lineChartInstance.getOption().series;
    expect(pie.data).toEqual([
      expect.objectContaining({ name: "SHENYU.INSTANCE.NO_DATA", value: 0 }),
    ]);
    expect(line).toMatchObject({
      name: "SHENYU.INSTANCE.NO_DATA",
      data: [0, 0, 0, 0, 0],
    });
    expect(pieDiv.textContent).toContain("SHENYU.INSTANCE.NO_DATA");
    expect(lineDiv.textContent).toContain("SHENYU.INSTANCE.NO_DATA");
  });

  it("removes the lines of the previous data when there are fewer", () => {
    component.renderLineChart([
      { name: "a", data: [1, 2, 3] },
      { name: "b", data: [2, 3, 4] },
      { name: "c", data: [3, 4, 0] },
    ]);
    expect(component.lineChartInstance.getOption().series).toHaveLength(3);

    component.renderLineChart([{ name: "d", data: [0, 1, 2] }]);
    const { series } = component.lineChartInstance.getOption();
    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({ name: "d", data: [0, 1, 2] });

    component.renderLineChart([]);
    const [placeholder, ...rest] =
      component.lineChartInstance.getOption().series;
    expect(rest).toHaveLength(0);
    expect(placeholder).toMatchObject({ name: "SHENYU.INSTANCE.NO_DATA" });
  });

  it("skips rendering while the chart data is undefined", () => {
    const pieSetOption = jest.spyOn(component.pieChartInstance, "setOption");
    const lineSetOption = jest.spyOn(component.lineChartInstance, "setOption");

    component.renderPieChart(undefined);
    component.renderLineChart(undefined);

    expect(pieSetOption).not.toHaveBeenCalled();
    expect(lineSetOption).not.toHaveBeenCalled();
  });
});
