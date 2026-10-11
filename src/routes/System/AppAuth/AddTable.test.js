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

import {
  AddTableComponent,
  getNextPathRowKey,
  normalizePathRows,
} from "./AddTable";

jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
}));

const makeComponent = (props = {}) => {
  const component = new AddTableComponent({
    form: { setFieldsValue: jest.fn() },
    metaGroup: {},
    ...props,
  });
  component.setState = (update) => {
    const next =
      typeof update === "function"
        ? update(component.state, component.props)
        : update;
    component.state = { ...component.state, ...next };
  };
  return component;
};

it("assigns unique client keys to loaded rows", () => {
  expect(
    normalizePathRows([
      { key: 4, path: "/a" },
      { key: 4, path: "/b" },
      { id: "server-id", path: "/c" },
    ]).map((item) => item.key),
  ).toEqual([4, 5, 6]);
});

it("deletes only the row with the matching client key", () => {
  const component = makeComponent();
  component.state = {
    ...component.state,
    allData: [
      { key: 0, path: "" },
      { key: 1, path: "" },
    ],
  };

  component.handleDelete(0);

  expect(component.state.allData).toEqual([{ key: 1, path: "" }]);
});

it("does not reuse a surviving key after deletion", () => {
  expect(getNextPathRowKey([{ key: 0 }, { key: 2 }])).toBe(3);

  const component = makeComponent();
  component.state = {
    ...component.state,
    allData: [
      { key: 0, path: "/a" },
      { key: 2, path: "/c" },
    ],
  };

  component.handleAddTd();

  expect(component.state.allData[2]).toEqual({
    key: 3,
    path: "",
    pathDesc: "",
  });
});

it("updates only the row with the matching client key", () => {
  const component = makeComponent();
  component.state = {
    ...component.state,
    allData: [
      { key: 0, path: "/same" },
      { key: 1, path: "/same" },
    ],
  };

  component.handleTableInput({ path: "/changed" }, { key: 1 });

  expect(component.state.allData).toEqual([
    { key: 0, path: "/same" },
    { key: 1, path: "/changed" },
  ]);
});
