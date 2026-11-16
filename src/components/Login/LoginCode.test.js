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
import LoginCode from "./LoginCode";
import { randomNum } from "../_utils/utils";

jest.mock("../_utils/utils", () => ({
  originalCharacter: ["A", "B", "C", "D"],
  randomNum: jest.fn(() => 0),
}));
jest.mock("../../utils/IntlUtils", () => ({
  getIntlContent: () => "Refresh verification code",
}));

it("reports an initial code and refreshes by button or imperative handle", () => {
  const onCode = jest.fn();
  const ref = React.createRef();
  randomNum.mockReturnValue(0);
  render(<LoginCode ChildGetCode={onCode} onRef={ref} />);
  expect(onCode).toHaveBeenLastCalledWith("AAAA");
  randomNum.mockReturnValue(1);
  fireEvent.click(
    screen.getByRole("button", { name: "Refresh verification code: AAAA" }),
  );
  expect(onCode).toHaveBeenLastCalledWith("BBBB");
  randomNum.mockReturnValue(2);
  act(() => ref.current.handleChange());
  expect(onCode).toHaveBeenLastCalledWith("CCCC");
});

it("uses the latest owner callback after rerender", () => {
  const previous = jest.fn();
  const current = jest.fn();
  randomNum.mockReturnValue(0);
  const { rerender } = render(<LoginCode ChildGetCode={previous} />);
  rerender(<LoginCode ChildGetCode={current} />);
  randomNum.mockReturnValue(3);
  fireEvent.click(
    screen.getByRole("button", { name: "Refresh verification code: AAAA" }),
  );
  expect(current).toHaveBeenLastCalledWith("DDDD");
  expect(previous).toHaveBeenCalledTimes(1);
});
