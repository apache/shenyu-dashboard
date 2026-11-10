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
import { fireEvent, render, screen } from "@testing-library/react";
import HeadersEditor, {
  getNextEditorRowIndex,
  normalizeEditorRows,
} from "./HeadersEditor";

jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
}));

it("assigns unique stable indexes to loaded rows", () => {
  expect(
    normalizeEditorRows([
      { index: 2, key: "A", value: "1" },
      { index: 2, key: "B", value: "2" },
      { key: "C", value: "3" },
    ]).map((item) => item.index),
  ).toEqual([2, 3, 4]);
});

it("uses the highest existing index when adding after a deletion", () => {
  expect(getNextEditorRowIndex([{ index: 0 }, { index: 2 }])).toBe(3);
});

it("renders an empty list instead of crashing on a non-array value", () => {
  const { container, getByText } = render(
    <HeadersEditor value="{}" onChange={jest.fn()} buttonText="Add" />,
  );

  expect(container.querySelectorAll("input")).toHaveLength(0);
  expect(getByText("Add")).not.toBeNull();
});

it("deletes only the clicked row when header names are duplicated", () => {
  const onChange = jest.fn();
  const { container } = render(
    <HeadersEditor
      value={JSON.stringify([
        { index: 0, key: "", value: "first" },
        { index: 1, key: "", value: "second" },
      ])}
      onChange={onChange}
      buttonText="Add"
    />,
  );

  fireEvent.click(container.querySelectorAll(".anticon-minus-circle-o")[0]);

  expect(JSON.parse(onChange.mock.calls[0][0])).toEqual([
    { index: 1, key: "", value: "second" },
  ]);
});

it("removes a row through a keyboard-operable button", () => {
  const onChange = jest.fn();
  render(
    <HeadersEditor
      value={JSON.stringify([{ index: 0, key: "A", value: "1" }])}
      onChange={onChange}
      buttonText="Add"
    />,
  );

  const removeButton = screen.getByLabelText("SHENYU.COMMON.DELETE");
  expect(removeButton.tagName).toBe("BUTTON");

  fireEvent.click(removeButton);
  expect(JSON.parse(onChange.mock.calls[0][0])).toEqual([]);
});

it("adds a row without reusing a surviving index", () => {
  const onChange = jest.fn();
  const { getByText } = render(
    <HeadersEditor
      value={JSON.stringify([
        { index: 0, key: "A", value: "1" },
        { index: 2, key: "C", value: "3" },
      ])}
      onChange={onChange}
      buttonText="Add"
    />,
  );

  fireEvent.click(getByText("Add"));

  expect(JSON.parse(onChange.mock.calls[0][0])).toEqual([
    { index: 0, key: "A", value: "1" },
    { index: 2, key: "C", value: "3" },
    { index: 3, key: "", value: "" },
  ]);
});

it("re-syncs rows when the external value returns to a previously emitted value", () => {
  const onChange = jest.fn();
  const { container, rerender } = render(
    <HeadersEditor
      value={JSON.stringify([{ index: 0, key: "A", value: "1" }])}
      onChange={onChange}
      buttonText="Add"
    />,
  );

  // local edit emits a new value
  fireEvent.change(container.querySelectorAll("input")[0], {
    target: { value: "B" },
  });
  const emitted = onChange.mock.calls[0][0];

  // external value becomes different, then returns to the emitted value
  rerender(
    <HeadersEditor
      value={JSON.stringify([{ index: 0, key: "Y", value: "9" }])}
      onChange={onChange}
      buttonText="Add"
    />,
  );
  rerender(
    <HeadersEditor value={emitted} onChange={onChange} buttonText="Add" />,
  );

  expect(container.querySelectorAll("input")[0].value).toBe("B");
});
