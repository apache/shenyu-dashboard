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
import { getIntlContent } from "../utils/IntlUtils";
import {
  getAllAuths,
  findAuthData,
  findAuthDataDel,
  updateAuthData,
  updateAuthDel,
  updateAuthEnabled,
  updateAuthOpened,
  deleteAuths,
  addAuthData,
  syncAuthsData,
  getAllMetadata,
  getAllMetadatas,
  getfetchMetaGroup,
} from "../services/api";

export default {
  namespace: "auth",

  state: {
    authList: [],
    total: 0,
  },

  effects: {
    *fetch(params, { call, put }) {
      const { payload } = params;
      const json = yield call(getAllAuths, payload);
      if (json.code === 200) {
        let { page, dataList } = json.data;
        dataList = dataList.map((item) => {
          item.key = item.id;
          return item;
        });
        yield put({
          type: "saveAuths",
          payload: {
            total: page.totalCount,
            dataList,
          },
        });
      }
    },
    *fetchItem(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(findAuthData, payload);
      if (json.code === 200) {
        const auth = json.data;
        if (typeof callback === "function") {
          callback(auth);
        }
      }
    },
    *fetchItemDel(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(findAuthDataDel, payload);
      if (json.code === 200) {
        const auth = json.data;
        if (typeof callback === "function") {
          callback({ auth });
        }
      }
    },
    *fetchMeta(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(getAllMetadatas, payload);
      if (json.code === 200) {
        let dataList = json.data.map((item) => {
          item = {
            id: item.id,
            path: item.path,
            appName: item.appName,
            enabled: item.enabled,
          };
          return item;
        });
        if (typeof callback === "function") {
          callback({ dataList });
        }
      }
    },
    *fetchMetaGroup(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(getfetchMetaGroup, payload);
      if (json.code === 200) {
        if (typeof callback === "function") {
          callback(json.data);
        }
      }
    },
    *add(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(addAuthData, payload);
      if (json.code === 200) {
        message.success(getIntlContent("SHENYU.COMMON.RESPONSE.ADD.SUCCESS"));
        if (typeof callback === "function") {
          callback();
        }
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *delete(params, { call, put }) {
      const { payload, fetchValue, callback } = params;

      const json = yield call(deleteAuths, payload);
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.DELETE.SUCCESS"),
        );
        if (typeof callback === "function") {
          callback();
        }
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *update(params, { call, put }) {
      const { payload, callback, fetchValue } = params;

      const json = yield call(updateAuthData, payload);
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS"),
        );
        if (typeof callback === "function") {
          callback();
        }
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *updateDel(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(updateAuthDel, payload);
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS"),
        );
        if (typeof callback === "function") {
          callback();
        }
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *reload(params, { put }) {
      const { fetchValue } = params;
      const { appKey, phone, currentPage, pageSize, namespaceId } = fetchValue;
      const payload = { appKey, phone, currentPage, pageSize, namespaceId };
      yield put({ type: "fetch", payload });
    },
    *updateEn(params, { call, put }) {
      const { payload, fetchValue, callback } = params;
      const json = yield call(updateAuthEnabled, payload);
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS"),
        );
        if (typeof callback === "function") {
          callback();
        }
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *updateOp(params, { call, put }) {
      const { payload, fetchValue, callback } = params;
      const json = yield call(updateAuthOpened, payload);
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS"),
        );
        if (typeof callback === "function") {
          callback();
        }
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *syncDa(params, { call }) {
      const { payload } = params;
      const json = yield call(syncAuthsData, payload);
      if (json.code === 200) {
        message.success(getIntlContent("SHENYU.COMMON.RESPONSE.SYNC.SUCCESS"));
      } else {
        message.warn(json.message);
      }
    },
    *getDatas(params, { call }) {
      const { payload } = params;
      yield call(getAllMetadata, payload);
    },
  },

  reducers: {
    saveAuths(state, { payload }) {
      return {
        ...state,
        authList: payload.dataList,
        total: payload.total,
      };
    },
    // saveUsers(state, { payload }) {
    //   return {
    //     ...state,
    //     userList: payload.dataList,
    //     total: payload.total
    //   };
    // }
  },
};
