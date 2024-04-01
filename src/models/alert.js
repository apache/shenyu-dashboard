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
  getAlertReceivers,
  getAlertReceiverDetail,
  updateAlertReceiver,
  addAlertReceiver,
  deleteAlertReceivers,
  fetchAlertReport,
} from "../services/api";

export default {
  namespace: "alert",

  state: {
    alertList: [],
    total: 0,
  },

  effects: {
    *fetch({ payload }, { call, put }) {
      const response = yield call(getAlertReceivers, payload);
      yield put({
        type: "save",
        payload: response.data,
      });
    },
    *fetchItem({ payload, callback }, { call }) {
      const json = yield call(getAlertReceiverDetail, payload);
      if (json.code === 200) {
        const alert = json.data;
        callback(alert);
      }
    },
    *update(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(updateAlertReceiver, payload);
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS"),
        );
        callback();
      } else {
        message.warn(json.message);
      }
    },
    *add(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(addAlertReceiver, payload);
      if (json.code === 200) {
        message.success(getIntlContent("SHENYU.COMMON.RESPONSE.ADD.SUCCESS"));
        callback();
      } else {
        message.warn(json.message);
      }
    },
    *delete(params, { call, put }) {
      const { payload, fetchValue, callback } = params;
      const { list } = payload;
      const json = yield call(deleteAlertReceivers, { list });
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
    *sendTest(params, { call }) {
      const { payload } = params;
      const json = yield call(fetchAlertReport, payload);
      if (json.code === 200) {
        message.success(getIntlContent("SHENYU.SYSTEM.ALERT.SEND_SUCCESS"));
      } else {
        message.warn(json.message);
      }
    },
    *reload(params, { put }) {
      const { fetchValue } = params;
      const { userName, currentPage, pageSize } = fetchValue;
      const payload = { userName, currentPage, pageSize };
      yield put({ type: "fetch", payload });
    },
  },

  reducers: {
    save(state, { payload }) {
      return {
        ...state,
        alertList: payload.dataList,
        total: payload.page.totalCount,
      };
    },
  },
};
