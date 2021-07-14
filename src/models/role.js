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
  getAllRoles,
  getRoleList,
  findRole,
  updateRole,
  deleteRole,
  addRole
} from "../services/api";
import {getIntlContent} from "../utils/IntlUtils";

export default {
  namespace: "role",

  state: {
    allRoles: [],
    roleList: [],
    total: 0
  },

  effects: {
    *fetch(params, { call, put }) {
      const { payload } = params;
      const json = yield call(getRoleList, payload);
      if (json.code === 200) {
        let { page, dataList } = json.data;

        dataList = dataList.map(item => {
          item.key = item.id;
          return item;
        });
        yield put({
          type: "saveRoles",
          payload: {
            total: page.totalCount,
            dataList
          }
        });
      }
    },
    *fetchAll(params, { call, put }) {
      const json = yield call(getAllRoles);
      if (json.code === 200) {
        const allRoles = json.data;
        yield put({
          type: "saveAllRoles",
          payload: {
            allRoles
          }
        });
      }
    },
    *fetchItem(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(findRole, payload);
      if (json.code === 200) {
        const role = json.data;
        callback(role);
      }
    },
    *add(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(addRole, payload);
      if (json.code === 200) {
        message.success(getIntlContent('SHENYU.COMMON.RESPONSE.ADD.SUCCESS'));
        callback();
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *delete(params, { call, put }) {
      const { payload, fetchValue, callback } = params;
      const { list } = payload;
      const json = yield call(deleteRole, { list });
      if (json.code === 200) {
        message.success(getIntlContent('SHENYU.COMMON.RESPONSE.DELETE.SUCCESS'));
        callback();
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *update(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(updateRole, payload);
      if (json.code === 200) {
        message.success(getIntlContent('SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS'));
        callback();
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },

    *reload(params, { put }) {
      const { fetchValue } = params;
      const { roleName, currentPage, pageSize } = fetchValue;
      const payload = { roleName, currentPage, pageSize };
      yield put({ type: "fetch", payload });
      yield put({ type: "fetchAll" });
    }
  },

  reducers: {
    saveRoles(state, { payload }) {
      return {
        ...state,
        roleList: payload.dataList,
        total: payload.total
      };
    },
    saveAllRoles(state, { payload }) {
      return {
        ...state,
        allRoles: payload.allRoles
      };
    }
  }
};
