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

import {getInstancesByNamespace, findInstance, findInstanceAnalysis} from "../services/api";

export default {
  namespace: "instance",

  state: {
    instanceList: [],
    total: 0,
    pieData:[],
    lineList:[]
  },

  effects: {
    *fetch(params, { call, put }) {
      const { payload } = params;
      const json = yield call(getInstancesByNamespace, payload);
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
    *fetchAnalysis(params, { call, put }) {
      const { payload } = params;
      const json = yield call(findInstanceAnalysis, payload);

      if (json.code === 200) {
        let { pieData, lineData } = json.data;
        yield put({
          type: "saveInstancesAnalysis",
          payload: {
            pieData,
            lineData
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
        pieData: payload.pieData,
        lineData: payload.lineData,
      };
    },
  },
};
