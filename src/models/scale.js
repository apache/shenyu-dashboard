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
  getAllScalePolicies,
  getScaleRules,
  getScalePolicy,
  updateScalePolicy,
  getScaleRule,
  addScaleRule,
  updateScaleRule,
  deleteScaleRules,
} from "../services/api";

export default {
  namespace: "scale",

  state: {
    ruleList: [],
    policyList: [],
    total: 0,
  },

  effects: {
    *fetchPolicy(_, { call, put }) {
      const response = yield call(getAllScalePolicies);
      yield put({
        type: "savePolicy",
        payload: response.data.sort((a, b) => a.sort - b.sort),
      });
    },
    *fetchPolicyItem({ payload, callback }, { call }) {
      const json = yield call(getScalePolicy, payload);
      if (json.code === 200) {
        const scale = json.data;
        callback(scale);
      }
    },
    *updatePolicy(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(updateScalePolicy, payload);
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS"),
        );
        callback();
      } else {
        message.warn(json.message);
      }
    },
    *fetchRule({ payload }, { call, put }) {
      const response = yield call(getScaleRules, payload);
      yield put({
        type: "saveRule",
        payload: response.data,
      });
    },
    *fetchRuleItem({ payload, callback }, { call }) {
      const json = yield call(getScaleRule, payload);
      if (json.code === 200) {
        const scale = json.data;
        callback(scale);
      }
    },
    *addRule(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(addScaleRule, payload);
      if (json.code === 200) {
        message.success(getIntlContent("SHENYU.COMMON.RESPONSE.ADD.SUCCESS"));
        callback();
      } else {
        message.warn(json.message);
      }
    },
    *updateRule(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(updateScaleRule, payload);
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS"),
        );
        callback();
      } else {
        message.warn(json.message);
      }
    },
    *deleteRules(params, { call, put }) {
      const { payload, fetchValue, callback } = params;
      const { list } = payload;
      const json = yield call(deleteScaleRules, { list });
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
    *reload(params, { put }) {
      const { fetchValue } = params;
      const payload = fetchValue || {};
      yield put({ type: "fetchRule", payload });
    },
  },

  reducers: {
    saveRule(state, { payload }) {
      return {
        ...state,
        ruleList: payload.dataList,
        total: payload.page.totalCount,
      };
    },
    savePolicy(state, { payload }) {
      return {
        ...state,
        policyList: payload,
      };
    },
  },
};
