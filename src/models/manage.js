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
  getAllUsers,
  findUser,
  updateUser,
  deleteUser,
  addUser,
  updatePassword
} from "../services/api";
import { getIntlContent } from "../utils/IntlUtils";

export default {
  namespace: "manage",

  state: {
    userList: [],
    total: 0
  },

  effects: {
    *fetch(params, { call, put }) {
      const { payload } = params;
      const json = yield call(getAllUsers, payload);
      if (json.code === 200) {
        let { page, dataList } = json.data;
        dataList = dataList.map(item => {
          item.key = item.id;
          return item;
        });
        yield put({
          type: "saveUsers",
          payload: {
            total: page.totalCount,
            dataList
          }
        });
      } else {
        yield put({
          type: "saveUsers",
          payload: {
            total: 0,
            dataList: []
          }
        });
      }
    },
    *fetchItem(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(findUser, payload);
      if (json.code === 200) {
        const user = json.data;
        callback(user);
      }
    },
    *add(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(addUser, payload);
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
      const json = yield call(deleteUser, { list });
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.DELETE.SUCCESS")
        );
        callback();
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *update(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(updateUser, payload);
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS")
        );
        callback();
        if (fetchValue) {
          yield put({ type: "reload", fetchValue });
        }
      } else {
        message.warn(json.message);
      }
    },
    *updatePassword(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(updatePassword, payload);
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS")
        );
        callback();
      } else {
        message.warn(json.message);
      }
    },
    *updateUserStatus(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(updateUser, payload);
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS")
        );
        callback();
      } else {
        message.warn(json.message);
      }
    },
    *reload(params, { put }) {
      const { fetchValue } = params;
      const { userName, currentPage, pageSize } = fetchValue;
      const payload = { userName, currentPage, pageSize };
      yield put({ type: "fetch", payload });
    }
  },

  reducers: {
    saveUsers(state, { payload }) {
      return {
        ...state,
        userList: payload.dataList,
        total: payload.total
      };
    }
  }
};
