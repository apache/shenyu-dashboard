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

import { runSaga, effects } from "dva/saga";
import createLoading from "./loading";
import globalModel from "../models/global";
import { queryPlatform } from "../services/api";

jest.mock("../services/api", () => ({ queryPlatform: jest.fn() }));
jest.mock("antd", () => ({ message: { warn: jest.fn(), success: jest.fn() } }));
jest.mock("../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock("../components/_utils/utils", () => ({
  defaultNamespaceId: "default-namespace",
}));

function setup(opts) {
  const loading = createLoading(opts);
  const reducer = loading.extraReducers.loading;
  let state = reducer(undefined, { type: "@@INIT" });
  const actions = [];
  const dispatch = (action) => {
    actions.push(action.type);
    state = reducer(state, action);
  };
  const run = (effect, model, actionType) =>
    runSaga(
      { dispatch, getState: () => ({}), onError: () => {} },
      loading.onEffect(effect, effects, model, actionType),
      { type: actionType },
      effects,
    );
  return { loading, run, actions, getState: () => state };
}

describe("createLoading", () => {
  it("hides loading after an effect resolves", async () => {
    const { run, actions, getState } = setup();
    function* ok() {
      yield effects.call(() => Promise.resolve());
    }

    await run(ok, { namespace: "demo" }, "demo/ok").done;

    expect(actions).toEqual(["@@DVA_LOADING/SHOW", "@@DVA_LOADING/HIDE"]);
    expect(getState()).toEqual({
      global: false,
      models: { demo: false },
      effects: { "demo/ok": false },
    });
  });

  it("returns the wrapped effect's result", async () => {
    const { run } = setup();
    function* withResult() {
      return yield effects.call(() => Promise.resolve("result"));
    }

    await expect(
      run(withResult, { namespace: "demo" }, "demo/result").done,
    ).resolves.toBe("result");
  });

  it("hides loading when a request rejects inside an effect", async () => {
    queryPlatform.mockRejectedValue(new Error("network down"));
    const { run, actions, getState } = setup();

    await expect(
      run(
        globalModel.effects.fetchPlatform,
        globalModel,
        "global/fetchPlatform",
      ).done,
    ).rejects.toThrow("network down");

    expect(actions).toEqual(["@@DVA_LOADING/SHOW", "@@DVA_LOADING/HIDE"]);
    expect(getState()).toEqual({
      global: false,
      models: { global: false },
      effects: { "global/fetchPlatform": false },
    });
  });

  it("hides loading when an effect is cancelled", async () => {
    const { run, getState } = setup();
    function* pending() {
      yield effects.call(() => new Promise(() => {}));
    }

    const task = run(pending, { namespace: "demo" }, "demo/pending");
    expect(getState().effects["demo/pending"]).toBe(true);
    task.cancel();
    await task.done;

    expect(getState().global).toBe(false);
    expect(getState().effects["demo/pending"]).toBe(false);
  });

  it("leaves effects excluded by only/except unwrapped", () => {
    const { loading } = setup({ only: ["demo/tracked"] });
    function* untracked() {
      yield effects.call(() => Promise.resolve());
    }

    expect(
      loading.onEffect(untracked, effects, { namespace: "demo" }, "demo/other"),
    ).toBe(untracked);
  });
});
