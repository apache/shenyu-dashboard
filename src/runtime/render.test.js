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

import React, { useEffect, useState } from "react";
import { act } from "@testing-library/react";
import renderApp from "./render";

it("batches promise updates and cleans up the application root", async () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const commits = jest.fn();
  const cleanup = jest.fn();
  let update;
  function App() {
    const [first, setFirst] = useState(0);
    const [second, setSecond] = useState(false);
    update = () =>
      Promise.resolve().then(() => {
        setFirst(1);
        setSecond(true);
      });
    useEffect(() => {
      commits(first, second);
    }, [first, second]);
    useEffect(() => cleanup, []);
    return <span>{`${first}:${second}`}</span>;
  }
  let unmount;
  act(() => {
    unmount = renderApp(<App />, container);
  });
  expect(container.textContent).toBe("0:false");
  commits.mockClear();
  await act(async () => {
    await update();
  });
  expect(container.textContent).toBe("1:true");
  expect(commits).toHaveBeenCalledTimes(1);
  expect(commits).toHaveBeenCalledWith(1, true);
  act(() => unmount());
  expect(cleanup).toHaveBeenCalledTimes(1);
  expect(container.childElementCount).toBe(0);
  container.remove();
});
