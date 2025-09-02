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
  getRegistryList,
  insertOrUpdateRegistry,
  getRegistryDetail,
  batchDeleteRegistry,
} from "../services/api";
import { getIntlContent } from "../utils/IntlUtils";

export default {
  namespace: "registry",

  state: {
    registryList: [],
    total: 0,
  },

  effects: {
    *fetch(params, { call, put }) {
      const { payload } = params;
      const json = yield call(getRegistryList, payload);
      if (json.code === 200) {
        let { dataList, page } = json.data;
        dataList = dataList.map((item) => {
          item.key = item.id;
          return item;
        });
        yield put({
          type: "saveRegistryList",
          payload: {
            total: page.totalCount,
            dataList,
          },
        });
      } else {
        message.destroy();
        message.error(json.message);
      }
    },

    *add(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(insertOrUpdateRegistry, payload);
      if (json.code === 200) {
        message.destroy();
        message.success(getIntlContent("SHENYU.COMMON.RESPONSE.ADD.SUCCESS"));
        callback();
        yield put({ type: "fetch", payload: fetchValue });
      } else {
        message.destroy();
        message.error(json.message);
      }
    },

    *update(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(insertOrUpdateRegistry, payload);
      if (json.code === 200) {
        message.destroy();
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS"),
        );
        callback();
        yield put({ type: "fetch", payload: fetchValue });
      } else {
        message.destroy();
        message.error(json.message);
      }
    },

    *delete(params, { call, put }) {
      const { payload, fetchValue, callback } = params;
      const { list } = payload;
      const json = yield call(batchDeleteRegistry, { list });
      if (json.code === 200) {
        message.destroy();
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.DELETE.SUCCESS"),
        );
        callback();
        yield put({ type: "fetch", payload: fetchValue });
      } else {
        message.destroy();
        message.error(json.message);
      }
    },

    *fetchItem(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(getRegistryList, { id: payload.id });
      if (json.code === 200) {
        const registry = json.data.dataList[0];
        callback(registry);
      } else {
        message.destroy();
        message.error(json.message);
      }
    },
    *getDetail(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(getRegistryDetail, payload);
      if (json.code === 200) {
        const registry = json.data;
        callback(registry);
      } else {
        message.destroy();
        message.error(json.message);
      }
    },
  },

  reducers: {
    saveRegistryList(state, { payload }) {
      return {
        ...state,
        registryList: payload.dataList,
        total: payload.total,
      };
    },
  },
};
