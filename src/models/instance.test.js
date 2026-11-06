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

import model from "./instance";

jest.mock("../services/api", () => ({
  findInstance: jest.fn(),
  findInstanceAnalysis: jest.fn(),
  getInstancesByNamespace: jest.fn(),
}));

const effects = {
  call: (fn, ...args) => ({ type: "call", fn, args }),
  put: (action) => ({ type: "put", action }),
  select: (selector) => ({ type: "select", selector }),
};

// Runs an effect against a store state and returns the actions it puts.
// `response` is the result of the API call, and `onCall` runs while the
// request is in flight, e.g. to switch the namespace.
const run = (effect, payload, { state, response, onCall = () => {} }) => {
  const generator = effect({ payload }, effects);
  const actions = [];
  let step = generator.next();
  while (!step.done) {
    const { type, selector, action } = step.value;
    let input;
    if (type === "select") {
      input = selector(state);
    } else if (type === "call") {
      onCall();
      input = response;
    } else if (type === "put") {
      actions.push(action);
    }
    step = generator.next(input);
  }
  return actions;
};

// Starts an effect and runs it up to its API call. Returns `respond`, which
// resumes the effect with the response and returns the actions put after it,
// so that a test can resolve several requests in any order.
const start = (effect, payload, state) => {
  const generator = effect({ payload }, effects);
  const actions = [];
  const resume = (input) => {
    let step = generator.next(input);
    while (!step.done && step.value.type !== "call") {
      const { type, selector, action } = step.value;
      if (type === "put") {
        actions.push(action);
      }
      step = generator.next(type === "select" ? selector(state) : undefined);
    }
    return step;
  };
  expect(resume().done).toBe(false);
  actions.splice(0);
  return {
    respond: (response) => {
      resume(response);
      return actions.splice(0);
    },
  };
};

const store = (shownNamespaceId, currentNamespaceId) => ({
  instance: { analysisNamespaceId: shownNamespaceId },
  global: { currentNamespaceId },
});

const analysis = {
  code: 200,
  data: { pieData: [{ name: "a", value: 1 }], lineData: [{ name: "a" }] },
};

// A table response with one instance, and the action that saves it.
const table = (id) => ({
  code: 200,
  data: { page: { totalCount: 1 }, dataList: [{ id }] },
});
const saved = (id) => ({
  type: "saveInstances",
  payload: { total: 1, dataList: [{ id, key: id }] },
});

describe("instance model", () => {
  it("clears the charts of the previous namespace while the analysis loads", () => {
    const actions = run(
      model.effects.fetchAnalysis,
      { namespaceId: "namespace-b" },
      { state: store("namespace-a", "namespace-b"), response: analysis },
    );

    expect(actions).toEqual([
      {
        type: "saveInstancesAnalysis",
        payload: { namespaceId: "namespace-b", pieData: [], lineData: [] },
      },
      {
        type: "saveInstancesAnalysis",
        payload: { namespaceId: "namespace-b", ...analysis.data },
      },
    ]);
  });

  it("keeps the charts while the analysis of the shown namespace is refreshed", () => {
    const actions = run(
      model.effects.fetchAnalysis,
      { namespaceId: "namespace-a" },
      { state: store("namespace-a", "namespace-a"), response: analysis },
    );

    expect(actions).toEqual([
      {
        type: "saveInstancesAnalysis",
        payload: { namespaceId: "namespace-a", ...analysis.data },
      },
    ]);
  });

  it("drops an analysis response for a namespace that is no longer selected", () => {
    const state = store("namespace-a", "namespace-a");
    const actions = run(
      model.effects.fetchAnalysis,
      { namespaceId: "namespace-a" },
      {
        state,
        response: analysis,
        onCall: () => {
          state.global.currentNamespaceId = "namespace-b";
        },
      },
    );

    expect(actions).toEqual([]);
  });

  it("skips an analysis request for a namespace that is no longer selected", () => {
    const onCall = jest.fn();
    const actions = run(
      model.effects.fetchAnalysis,
      { namespaceId: "namespace-a" },
      {
        state: store("namespace-a", "namespace-b"),
        response: analysis,
        onCall,
      },
    );

    expect(actions).toEqual([]);
    expect(onCall).not.toHaveBeenCalled();
  });

  it("leaves the charts cleared when the analysis request fails", () => {
    const actions = run(
      model.effects.fetchAnalysis,
      { namespaceId: "namespace-b" },
      {
        state: store("namespace-a", "namespace-b"),
        response: { code: 500, message: "error" },
      },
    );

    expect(actions).toEqual([
      {
        type: "saveInstancesAnalysis",
        payload: { namespaceId: "namespace-b", pieData: [], lineData: [] },
      },
    ]);
  });

  it("drops a table response for a namespace that is no longer selected", () => {
    const state = store(undefined, "namespace-a");
    const actions = run(
      model.effects.fetch,
      { namespaceId: "namespace-a", currentPage: 1, pageSize: 12 },
      {
        state,
        response: {
          code: 200,
          data: { page: { totalCount: 1 }, dataList: [{ id: "1" }] },
        },
        onCall: () => {
          state.global.currentNamespaceId = "namespace-b";
        },
      },
    );

    expect(actions).toEqual([]);
  });

  it("skips a table request for a namespace that is no longer selected", () => {
    const onCall = jest.fn();
    const actions = run(
      model.effects.fetch,
      { namespaceId: "namespace-a", currentPage: 1, pageSize: 12 },
      {
        state: store(undefined, "namespace-b"),
        response: {
          code: 200,
          data: { page: { totalCount: 1 }, dataList: [{ id: "1" }] },
        },
        onCall,
      },
    );

    expect(actions).toEqual([]);
    expect(onCall).not.toHaveBeenCalled();
  });

  it("drops a late analysis response after switching A -> B -> A", () => {
    const state = store("namespace-a", "namespace-a");
    const first = start(
      model.effects.fetchAnalysis,
      { namespaceId: "namespace-a" },
      state,
    );
    state.global.currentNamespaceId = "namespace-b";
    const second = start(
      model.effects.fetchAnalysis,
      { namespaceId: "namespace-b" },
      state,
    );
    state.instance.analysisNamespaceId = "namespace-b";
    state.global.currentNamespaceId = "namespace-a";
    const third = start(
      model.effects.fetchAnalysis,
      { namespaceId: "namespace-a" },
      state,
    );
    state.instance.analysisNamespaceId = "namespace-a";

    const latest = {
      code: 200,
      data: { pieData: [{ name: "new", value: 2 }], lineData: [] },
    };
    expect(third.respond(latest)).toEqual([
      {
        type: "saveInstancesAnalysis",
        payload: { namespaceId: "namespace-a", ...latest.data },
      },
    ]);
    expect(second.respond(analysis)).toEqual([]);
    expect(first.respond(analysis)).toEqual([]);
  });

  it("applies only the newest of two analysis refreshes resolved out of order", () => {
    const state = store("namespace-a", "namespace-a");
    const older = start(
      model.effects.fetchAnalysis,
      { namespaceId: "namespace-a" },
      state,
    );
    const newer = start(
      model.effects.fetchAnalysis,
      { namespaceId: "namespace-a" },
      state,
    );

    const latest = {
      code: 200,
      data: { pieData: [{ name: "new", value: 2 }], lineData: [] },
    };
    expect(newer.respond(latest)).toEqual([
      {
        type: "saveInstancesAnalysis",
        payload: { namespaceId: "namespace-a", ...latest.data },
      },
    ]);
    expect(older.respond(analysis)).toEqual([]);
  });

  it("drops a late table response after switching A -> B -> A", () => {
    const state = store(undefined, "namespace-a");
    const payload = {
      namespaceId: "namespace-a",
      currentPage: 1,
      pageSize: 12,
    };
    const first = start(model.effects.fetch, payload, state);
    state.global.currentNamespaceId = "namespace-b";
    const second = start(
      model.effects.fetch,
      { ...payload, namespaceId: "namespace-b" },
      state,
    );
    state.global.currentNamespaceId = "namespace-a";
    const third = start(model.effects.fetch, payload, state);

    expect(third.respond(table("new"))).toEqual([saved("new")]);
    expect(second.respond(table("b"))).toEqual([]);
    expect(first.respond(table("old"))).toEqual([]);
  });

  it("applies only the newest of two table refreshes resolved out of order", () => {
    const state = store(undefined, "namespace-a");
    const payload = {
      namespaceId: "namespace-a",
      currentPage: 1,
      pageSize: 12,
    };
    const older = start(model.effects.fetch, payload, state);
    const newer = start(
      model.effects.fetch,
      { ...payload, currentPage: 2 },
      state,
    );

    expect(newer.respond(table("new"))).toEqual([saved("new")]);
    expect(older.respond(table("old"))).toEqual([]);
  });

  it("starts with empty chart data", () => {
    expect(model.state).toMatchObject({ pieData: [], lineData: [] });
  });

  it("stores the namespace of the saved analysis", () => {
    const state = model.reducers.saveInstancesAnalysis(
      { pieData: [], lineData: [] },
      { payload: { namespaceId: "namespace-b", ...analysis.data } },
    );

    expect(state).toEqual({
      analysisNamespaceId: "namespace-b",
      ...analysis.data,
    });
  });
});
