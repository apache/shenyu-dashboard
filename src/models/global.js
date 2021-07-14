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
import { routerRedux } from "dva/router";
import { queryPlatform, getAllPlugins, asyncOnePlugin, getUserPermissionByToken } from "../services/api";
import {getIntlContent} from "../utils/IntlUtils";

export default {
  namespace: "global",

  state: {
    collapsed: false,
    platform: {},
    plugins: [],
    currentRouter: {},
    permissions: {},
    language: '',
  },

  effects: {
    *fetchPlatform(_, { call, put }) {
      const json = yield call(queryPlatform);
      if (json.code === 200) {
        yield put({
          type: "savePlatform",
          payload: json.data
        });
      }
    },
    *fetchPlugins({ payload }, { call, put }) {
      const { callback } = payload;
      const params = {
        currentPage: 1,
        pageSize: 50
      };
      const json = yield call(getAllPlugins, params);
      if (json.code === 200) {
        let { dataList } = json.data;

        callback(dataList)
        yield put({
          type: "savePlugins",
          payload: {
            dataList
          }
        });
      }
    },
    *asyncPlugin(params, { call }) {
      const { payload } = params;
      const json = yield call(asyncOnePlugin, payload);
      if (json.code === 200) {
        message.success(getIntlContent('SHENYU.COMMON.RESPONSE.SYNC.SUCCESS'));
      } else {
        message.warn(json.message);
      }
    },
    *fetchPermission({ payload }, { call, put }) {
      const { callback } = payload;
      let permissions = { menu: [], button: [] };
      const token = window.sessionStorage.getItem("token");
      if(token){
        const params = { token };
        const json = yield call(getUserPermissionByToken, params);
        if (json.code === 200) {
          let { menu, currentAuth } = json.data;
          permissions = { menu, button: currentAuth };
        } else{
          message.warn(getIntlContent('SHENYU.PERMISSION.EMPTY'));
          yield put(
            routerRedux.push({
              pathname: "/user/login"
            })
          );
        }
      }

      yield put({
        type: "savePermissions",
        payload: { permissions }
      });
      callback(permissions);
    },
    *refreshPermission({ payload }, { call, put }) {
      const { callback } = payload;
      let permissions = { menu: [], button: [] };
      const token = window.sessionStorage.getItem("token");
      if(token){
        const params = { token };
        const json = yield call(getUserPermissionByToken, params);
        if (json.code === 200) {
          let { menu, currentAuth } = json.data;
          permissions = { menu, button: currentAuth };
        }
      }

      yield put({
        type: "savePermissions",
        payload: { permissions }
      });
      callback(permissions);
    },

    *resetPermission(_, { put }) {
      let permissions = { menu: [], button: [] };
      yield put({
        type: "savePermissions",
        payload: { permissions }
      });
    }
  },

  reducers: {
    changeLanguage(state, { payload} ) {
      return {
        ...state,
      language: payload,
      }
    },
    changeLayoutCollapsed(state, { payload }) {
      return {
        ...state,
        collapsed: payload
      };
    },
    savePlatform(state, { payload }) {
      return {
        ...state,
        platform: payload
      };
    },
    savePlugins(state, { payload }) {
      return {
        ...state,
        plugins: payload.dataList
      };
    },
    saveCurrentRoutr(state, { payload }) {
      return {
        ...state,
        currentRouter: payload.currentRouter
      };
    },
    savePermissions(state, { payload }) {
      return {
        ...state,
        permissions: payload.permissions
      };
    },
  },

  subscriptions: {
    setup({ history }) {
      // Subscribe history(url) change, trigger `load` action if pathname is `/`
      return history.listen(({ pathname, search }) => {
        if (typeof window.ga !== "undefined") {
          window.ga("send", "pageview", pathname + search);
        }
      });
    }
  }
};
