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
  getInstancesByNamespace,
  findInstance,
  findInstanceAnalysis,
} from "../services/api";

// Whether `namespaceId` is no longer the selected namespace because the user
// has switched to another one. Checked before starting a request and again
// before applying its response, so stale data never replaces the newer data.
function* isFromPreviousNamespace(namespaceId, select) {
  if (namespaceId === undefined) {
    return false;
  }
  const currentNamespaceId = yield select(
    ({ global }) => global.currentNamespaceId,
  );
  return namespaceId !== currentNamespaceId;
}

export default {
  namespace: "instance",

  state: {
    instanceList: [],
    total: 0,
    pieData: [],
    lineData: [],
    analysisNamespaceId: undefined,
  },

  effects: {
    *fetch(params, { call, put, select }) {
      const { payload } = params;
      // The user has already switched away, so don't load.
      if (yield* isFromPreviousNamespace(payload.namespaceId, select)) {
        return;
      }
      const json = yield call(getInstancesByNamespace, payload);
      if (yield* isFromPreviousNamespace(payload.namespaceId, select)) {
        return;
      }
      if (json.code === 200) {
        let { page, dataList } = json.data;
        dataList = dataList.map((item) => {
          item.key = item.id;
          return item;
        });
        yield put({
          type: "saveInstances",
          payload: {
            total: page.totalCount,
            dataList,
          },
        });
      }
    },
    *fetchAnalysis(params, { call, put, select }) {
      const { payload } = params;
      const { namespaceId } = payload;
      // The user has already switched away, so neither clear nor load.
      if (yield* isFromPreviousNamespace(namespaceId, select)) {
        return;
      }
      const shownNamespaceId = yield select(
        ({ instance }) => instance.analysisNamespaceId,
      );
      if (shownNamespaceId !== namespaceId) {
        // Don't keep showing the charts of the previous namespace while this
        // one loads, or if it fails.
        yield put({
          type: "saveInstancesAnalysis",
          payload: { namespaceId, pieData: [], lineData: [] },
        });
      }
      const json = yield call(findInstanceAnalysis, payload);
      if (yield* isFromPreviousNamespace(namespaceId, select)) {
        return;
      }

      if (json.code === 200) {
        let { pieData, lineData } = json.data;
        yield put({
          type: "saveInstancesAnalysis",
          payload: {
            namespaceId,
            pieData,
            lineData,
          },
        });
      }
    },
    *fetchItem(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(findInstance, payload);
      if (json.code === 200) {
        const instance = json.data;
        callback(instance);
      }
    },
    *reload(params, { put }) {
      const { fetchValue } = params;
      const { name, currentPage, instanceType, instanceIp, pageSize } =
        fetchValue;
      const payload = {
        name,
        instanceType,
        instanceIp,
        currentPage,
        pageSize,
      };
      yield put({ type: "fetch", payload });
    },
  },

  reducers: {
    saveInstances(state, { payload }) {
      return {
        ...state,
        instanceList: payload.dataList,
        total: payload.total,
      };
    },
    saveInstancesAnalysis(state, { payload }) {
      return {
        ...state,
        analysisNamespaceId: payload.namespaceId,
        pieData: payload.pieData,
        lineData: payload.lineData,
      };
    },
  },
};
