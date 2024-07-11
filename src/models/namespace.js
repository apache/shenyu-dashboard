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

import { message } from "antd";
import {
  getAllNamespaces,
  findNamespace,
  insertOrUpdateNamespace,
  deleteNamespace,
} from "../services/api";
import { getIntlContent } from "../utils/IntlUtils";

export default {
  namespace: "namespace",

  state: {
    namespaceList: [],
    total: 0,
  },

  effects: {
    *fetch(params, { call, put }) {
      const { payload } = params;
      const json = yield call(getAllNamespaces, payload);
      if (json.code === 200) {
        let { page, dataList } = json.data;
        dataList = dataList.map((item) => {
          item.key = item.id;
          return item;
        });
        yield put({
          type: "saveNamespaces",
          payload: {
            total: page.totalCount,
            dataList,
          },
        });
      }
    },
    *fetchItem(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(findNamespace, payload);
      if (json.code === 200) {
        const plugin = json.data;
        callback(plugin);
      }
    },
    *add(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(insertOrUpdateNamespace, payload);
      if (json.code === 200) {
        message.success(getIntlContent("SHENYU.COMMON.RESPONSE.ADD.SUCCESS"));
        callback();
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *delete(params, { call, put }) {
      const { payload, fetchValue, callback } = params;
      const { list } = payload;
      const json = yield call(deleteNamespace, { list });
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.DELETE.SUCCESS"),
        );
        callback();
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *update(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(insertOrUpdateNamespace, payload);
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS"),
        );
        callback();
        if (fetchValue) {
          yield put({ type: "reload", fetchValue });
        }
      } else {
        message.warn(json.message);
      }
    },

    *reload(params, { put }) {
      const { fetchValue } = params;
      const { name, currentPage, enabled, pageSize } = fetchValue;
      const payload = { name, enabled, currentPage, pageSize };
      yield put({ type: "fetch", payload });
    },
  },

  reducers: {
    saveNamespaces(state, { payload }) {
      return {
        ...state,
        namespaceList: payload.dataList,
        total: payload.total,
      };
    },
    updatePlugins(state, { payload }) {
      let pluginList = state.pluginList;
      pluginList = pluginList.map((item) => {
        if (item.id === payload.id) {
          item.enabled = payload.enabled;
        }
        return item;
      });
      return {
        ...state,
        pluginList,
      };
    },
  },
};
