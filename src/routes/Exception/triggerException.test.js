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
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import TriggerException from "./triggerException";

function renderWithStore(state) {
  const store = {
    getState: () => state,
    subscribe: () => () => {},
    dispatch: () => {},
  };
  return render(
    <Provider store={store}>
      <TriggerException />
    </Provider>,
  );
}

describe("TriggerException", () => {
  it("is not spinning on initial render, before any effect has run", () => {
    // Before the first dispatch, dva-loading's `effects` map is empty, so
    // `loading.effects["error/query"]` is undefined rather than false.
    const { container } = renderWithStore({ loading: { effects: {} } });
    expect(
      container.querySelector(".semi-spin:not(.semi-spin-hidden)"),
    ).toBeNull();
  });

  it("is spinning while the error/query effect is in flight", () => {
    const { container } = renderWithStore({
      loading: { effects: { "error/query": true } },
    });
    expect(
      container.querySelector(".semi-spin:not(.semi-spin-hidden)"),
    ).not.toBeNull();
  });

  it("is not spinning once the error/query effect has finished", () => {
    const { container } = renderWithStore({
      loading: { effects: { "error/query": false } },
    });
    expect(
      container.querySelector(".semi-spin:not(.semi-spin-hidden)"),
    ).toBeNull();
  });
});

const Trigger = TriggerException.WrappedComponent;
it("dispatches the selected error without changing codes", () => {
  const dispatch = jest.fn();
  render(<Trigger dispatch={dispatch} isloading={false} />);
  [401, 403, 500, 404].forEach((code) => {
    fireEvent.click(screen.getByRole("button", { name: `触发${code}` }));
    expect(dispatch).toHaveBeenLastCalledWith({
      type: "error/query",
      payload: { code },
    });
  });
  expect(dispatch).toHaveBeenCalledTimes(4);
});
