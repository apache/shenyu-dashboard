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

import "regenerator-runtime/runtime";
import { createMemoryHistory } from "history";
import createApp from "./createApp";
import { routerRedux } from "./router";
import createLoading from "../utils/loading";

it("preserves namespaced effects, reducers, subscriptions and navigation", async () => {
  const history = createMemoryHistory({ initialEntries: ["/user/login"] });
  const visited = [];
  const app = createApp({ history });
  app.use(createLoading());
  app.model({
    namespace: "demo",
    state: { value: 0 },
    reducers: { save: (state, { payload }) => ({ ...state, value: payload }) },
    effects: {
      *load({ payload }, { call, put }) {
        const value = yield call(() => Promise.resolve(payload));
        yield put({ type: "save", payload: value });
        yield put(routerRedux.push("/home"));
        return value;
      },
    },
    subscriptions: {
      setup({ history: modelHistory }) {
        return modelHistory.listen(({ location }) =>
          visited.push(location.pathname),
        );
      },
    },
  });
  app.start();
  const store = app._store; // eslint-disable-line no-underscore-dangle
  await expect(store.dispatch({ type: "demo/load", payload: 7 })).resolves.toBe(
    7,
  );
  expect(store.getState().demo).toEqual({ value: 7 });
  expect(store.getState().loading.effects["demo/load"]).toBe(false);
  expect(history.location.pathname).toBe("/home");
  expect(visited).toEqual(["/home"]);
  app.unmodel("demo");
  history.push("/other");
  expect(visited).toEqual(["/home"]);
});
