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
import { render, screen, act } from "@testing-library/react";
import PromiseRender from "./PromiseRender";

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
it("renders a component after permission resolves", async () => {
  const task = deferred();
  render(
    <PromiseRender
      promise={task.promise}
      ok={() => <span>Allowed</span>}
      error={<span>Denied</span>}
    />,
  );
  expect(screen.queryByText("Allowed")).toBeNull();
  await act(async () => task.resolve());
  expect(screen.getByText("Allowed")).toBeTruthy();
});
it("renders an element when permission rejects", async () => {
  const task = deferred();
  render(
    <PromiseRender
      promise={task.promise}
      ok={<span>Allowed</span>}
      error={<span>Denied</span>}
    />,
  );
  await act(async () => task.reject(new Error("denied")));
  expect(screen.getByText("Denied")).toBeTruthy();
  expect(screen.queryByText("Allowed")).toBeNull();
});
it("does not let an older grant replace a newer denial", async () => {
  const old = deferred(),
    current = deferred();
  const props = { ok: <span>Allowed</span>, error: <span>Denied</span> };
  const view = render(<PromiseRender {...props} promise={old.promise} />);
  view.rerender(<PromiseRender {...props} promise={current.promise} />);
  await act(async () => current.reject(new Error("denied")));
  await act(async () => old.resolve());
  expect(screen.getByText("Denied")).toBeTruthy();
  expect(screen.queryByText("Allowed")).toBeNull();
});
it("hides an earlier granted view while the replacement check is pending", async () => {
  const old = deferred(),
    current = deferred();
  const props = { ok: <span>Allowed</span>, error: <span>Denied</span> };
  const view = render(<PromiseRender {...props} promise={old.promise} />);
  await act(async () => old.resolve());
  view.rerender(<PromiseRender {...props} promise={current.promise} />);
  expect(screen.queryByText("Allowed")).toBeNull();
  await act(async () => current.reject(new Error("denied")));
  expect(screen.getByText("Denied")).toBeTruthy();
});
it("ignores completion after unmount", async () => {
  const task = deferred();
  const ref = React.createRef();
  const view = render(
    <PromiseRender
      ref={ref}
      promise={task.promise}
      ok={<span>Allowed</span>}
      error={<span>Denied</span>}
    />,
  );
  const setter = jest.spyOn(ref.current, "setState");
  view.unmount();
  await act(async () => task.resolve());
  expect(setter).not.toHaveBeenCalled();
});
it("exposes a pending status and ignores an old rejection after the current grant", async () => {
  const old = deferred(),
    current = deferred();
  const props = { ok: <span>Allowed</span>, error: <span>Denied</span> };
  const view = render(<PromiseRender {...props} promise={old.promise} />);
  expect(
    screen.getByRole("status", { name: "Loading permissions" }),
  ).toBeTruthy();
  view.rerender(<PromiseRender {...props} promise={current.promise} />);
  await act(async () => current.resolve());
  await act(async () => old.reject(new Error("stale")));
  expect(screen.getByText("Allowed")).toBeTruthy();
  expect(screen.queryByText("Denied")).toBeNull();
  expect(screen.queryByRole("status")).toBeNull();
});
