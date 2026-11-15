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

import model from "./common";

jest.mock("../services/api", () => ({ deleteRule: jest.fn() }));
jest.mock("../components/ui/feedback", () => ({
  message: { success: jest.fn(), warn: jest.fn() },
}));
jest.mock("../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
it("keeps selector filters and dependent tool page size on reload", () => {
  const fetchValue = {
    pluginId: "plugin-fixture",
    name: "server-filter",
    currentPage: 1,
    pageSize: 20,
    namespaceId: "ns-fixture",
    rulePageSize: 50,
  };
  expect(
    model.effects.reload({ fetchValue }, { put: (action) => action }).next()
      .value,
  ).toEqual({ type: "fetchSelector", payload: fetchValue });
});
it("keeps the tool name filter on reload", () => {
  const fetchValue = {
    selectorId: "selector-fixture",
    name: "tool-filter",
    currentPage: 2,
    pageSize: 20,
    namespaceId: "ns-fixture",
  };
  expect(
    model.effects.reloadRule({ fetchValue }, { put: (action) => action }).next()
      .value,
  ).toEqual({ type: "fetchRule", payload: fetchValue });
});
it.each([200, 500])(
  "notifies the caller only after successful tool deletion (%s)",
  (code) => {
    const callback = jest.fn();
    const gen = model.effects.deleteRule(
      {
        payload: { list: ["tool-fixture"], namespaceId: "ns-fixture" },
        fetchValue: {},
        callback,
      },
      { call: () => ({ code }), put: (action) => action },
    );
    let step = gen.next();
    while (!step.done) step = gen.next(step.value);
    expect(callback).toHaveBeenCalledTimes(code === 200 ? 1 : 0);
  },
);
