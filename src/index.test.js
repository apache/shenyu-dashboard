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

import { setRequestDispatch } from "./utils/request";

jest.mock("./polyfill", () => ({}));
jest.mock("dva", () => jest.fn(() => mockApp));
jest.mock("history", () => ({ createHashHistory: jest.fn(() => ({})) }));
jest.mock("./utils/loading", () => jest.fn(() => ({})));
jest.mock("./utils/IntlUtils", () => ({ initIntl: jest.fn() }));
jest.mock("./utils/emit", () => ({ emit: { on: jest.fn() } }));
jest.mock("./utils/request", () => ({ setRequestDispatch: jest.fn() }));
jest.mock("./models/global", () => ({ namespace: "global" }));
jest.mock("./router", () => jest.fn());

const mockApp = {
  use: jest.fn(),
  model: jest.fn(),
  router: jest.fn(),
  start: jest.fn(),
  _store: { dispatch: jest.fn() },
};

it("installs request dispatch before starting the app and resolves the live store", () => {
  // eslint-disable-next-line global-require
  require("./index");
  expect(setRequestDispatch.mock.invocationCallOrder[0]).toBeLessThan(
    mockApp.start.mock.invocationCallOrder[0],
  );
  expect(mockApp.start).toHaveBeenCalledWith("#root");
  const send = setRequestDispatch.mock.calls[0][0];
  const action = { type: "login/logout" };
  const firstDispatch = mockApp._store.dispatch; // eslint-disable-line no-underscore-dangle
  send(action);
  expect(firstDispatch).toHaveBeenCalledWith(action);
  const nextDispatch = jest.fn();
  mockApp._store = { dispatch: nextDispatch }; // eslint-disable-line no-underscore-dangle
  send({ type: "global/resetPermission" });
  expect(nextDispatch).toHaveBeenCalledWith({ type: "global/resetPermission" });
});
