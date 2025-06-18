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
  getAllSelectors,
  getAllRules,
  addSelector,
  findSelector,
  deleteSelector,
  updateSelector,
  enableSelector,
  addRule,
  deleteRule,
  findRule,
  updateRule,
  enableRule,
  asyncConfigExport,
  asyncConfigExportByNamespace,
  asyncConfigImport,
} from "../services/api";
import { getIntlContent } from "../utils/IntlUtils";

export default {
  namespace: "common",

  state: {
    selectorList: [],
    ruleList: [],
    selectorTotal: 0,
    ruleTotal: 0,
    currentSelector: "",
  },

  effects: {
    *fetchSelector({ payload }, { call, put }) {
      const { namespaceId } = payload;
      const json = yield call(getAllSelectors, { ...payload });
      if (json.code === 200) {
        let { page, dataList } = json.data;
        dataList = dataList.map((item) => {
          item.key = item.id;
          return item;
        });
        yield put({
          type: "saveSelector",
          payload: {
            selectorTotal: page.totalCount,
            selectorList: dataList,
          },
        });

        yield put({
          type: "saveCurrentSelector",
          payload: {
            currentSelector: dataList && dataList.length > 0 ? dataList[0] : "",
          },
        });
        if (dataList && dataList.length > 0) {
          yield put({
            type: "fetchRule",
            payload: {
              currentPage: 1,
              pageSize: 12,
              selectorId: dataList[0].id,
              namespaceId,
            },
          });
        } else {
          yield put({
            type: "saveRule",
            payload: {
              ruleTotal: 0,
              ruleList: [],
            },
          });
        }
      }
    },
    *fetchRule({ payload }, { call, put }) {
      const json = yield call(getAllRules, payload);
      if (json.code === 200) {
        let { page, dataList } = json.data;
        dataList = dataList.map((item) => {
          item.key = item.id;
          return item;
        });
        yield put({
          type: "saveRule",
          payload: {
            ruleTotal: page.totalCount,
            ruleList: dataList,
          },
        });
      }
    },
    *addSelector(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(addSelector, payload);
      if (json.code === 200) {
        message.success(getIntlContent("SHENYU.COMMON.RESPONSE.ADD.SUCCESS"));
        const selectorId = json.data;
        callback(selectorId);
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },

    *addRule(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(addRule, payload);
      if (json.code === 200) {
        message.success(getIntlContent("SHENYU.COMMON.RESPONSE.ADD.SUCCESS"));
        callback();
        yield put({ type: "reloadRule", fetchValue });
      } else {
        message.warn(json.message);
      }
    },

    *fetchSeItem(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(findSelector, payload);
      if (json.code === 200) {
        const selector = json.data;
        callback(selector);
      }
    },
    *deleteSelector(params, { call, put }) {
      const { payload, fetchValue } = params;
      const { list, namespaceId } = payload;
      const json = yield call(deleteSelector, { list, namespaceId });
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.DELETE.SUCCESS"),
        );
        yield put({
          type: "saveRule",
          payload: {
            ruleTotal: 0,
            ruleList: [],
          },
        });
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *updateSelector(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(updateSelector, payload);
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS"),
        );
        callback();
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *enableSelector(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(enableSelector, payload);
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS"),
        );
        if (callback) {
          callback();
        }
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *deleteRule(params, { call, put }) {
      const { payload, fetchValue } = params;
      const { list, namespaceId } = payload;
      const json = yield call(deleteRule, { list, namespaceId });
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.DELETE.SUCCESS"),
        );
        yield put({ type: "reloadRule", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *fetchRuleItem(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(findRule, payload);
      if (json.code === 200) {
        const rule = json.data;
        callback(rule);
      }
    },
    *updateRule(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(updateRule, payload);
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS"),
        );
        callback();
        yield put({ type: "reloadRule", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *enableRule(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(enableRule, payload);
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS"),
        );
        if (callback) {
          callback();
        }
        yield put({ type: "reloadRule", fetchValue });
      } else {
        message.warn(json.message);
      }
    },

    *reload(params, { put }) {
      const { fetchValue } = params;
      const { pluginId, currentPage, pageSize, namespaceId } = fetchValue;
      const payload = { pluginId, currentPage, pageSize, namespaceId };
      yield put({ type: "fetchSelector", payload });
    },

    *reloadRule(params, { put }) {
      const { fetchValue } = params;
      const { selectorId, currentPage, pageSize, namespaceId } = fetchValue;
      const payload = { selectorId, currentPage, pageSize, namespaceId };
      yield put({ type: "fetchRule", payload });
    },

    *exportAll(_, { call }) {
      yield call(asyncConfigExport);
    },

    *exportByNamespace(params, { call }) {
      yield call(asyncConfigExportByNamespace, params);
    },

    *import(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(asyncConfigImport, payload);
      if (json.code === 200) {
        if (json.data === null) {
          message.success(
            getIntlContent("SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS"),
          );
          callback();
        } else {
          // message.warn(JSON.stringify(json.data));
          callback(JSON.stringify(json.data));
        }
      } else {
        message.warn(json.message);
      }
    },
  },

  reducers: {
    saveSelector(state, { payload }) {
      return {
        ...state,
        selectorList: payload.selectorList,
        selectorTotal: payload.selectorTotal,
      };
    },

    saveRule(state, { payload }) {
      return {
        ...state,
        ruleList: payload.ruleList,
        ruleTotal: payload.ruleTotal,
      };
    },
    saveCurrentSelector(state, { payload }) {
      return {
        ...state,
        currentSelector: payload.currentSelector,
      };
    },
    resetData() {
      return {
        selectorList: [],
        ruleList: [],
        selectorTotal: 0,
        ruleTotal: 0,
        currentSelector: "",
      };
    },
  },
};
