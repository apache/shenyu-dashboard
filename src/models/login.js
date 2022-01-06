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

import { routerRedux } from "dva/router";
// import { stringify } from "qs";
import { message } from "antd";
import { queryLogin } from "../services/api";
// import { getPageQuery } from "../utils/utils";

export default {
  namespace: "login",

  state: {
    status: undefined
  },

  effects: {
    *login({ payload }, { call, put }) {
      const response = yield call(queryLogin, payload);

      // Login successfully
      if (response.data) {
        yield put({
          type: "changeLoginStatus",
          payload: {
            status: true,
            currentAuthority: "admin"
          }
        });
        window.sessionStorage.setItem("token", response.data.token);
        window.sessionStorage.setItem("userName", response.data.userName);
        window.sessionStorage.setItem("userId", response.data.id);
        /* const urlParams = new URL(window.location.href);
         const params = getPageQuery();
         let { redirect } = params;
         if (redirect) {
           const redirectUrlParams = new URL(redirect);
           if (redirectUrlParams.origin === urlParams.origin) {
             redirect = redirect.substr(urlParams.origin.length);
             if (redirect.startsWith("/#")) {
               redirect = redirect.substr(2);
             }
           } else {
             window.location.href = redirect;
             return;
           }
         } */

        yield put(routerRedux.push("/home"));
      } else {
        message.destroy();
        if (response.code === 404) {
          message.error("Incorrect user name or password");
        } else {
          message.error(response.message);
        }
      }
    },
    *logout(_, { put }) {
      yield put({
        type: "changeLoginStatus",
        payload: {
          status: false,
          currentAuthority: ""
        }
      });
      window.sessionStorage.removeItem("token");
      window.sessionStorage.removeItem("userName");
      window.sessionStorage.removeItem("userId");
      yield put(
        routerRedux.push({
          pathname: "/user/login"
          /* search: stringify({
            redirect: window.location.href
          }) */
        })
      );
    }
  },

  reducers: {
    changeLoginStatus(state, { payload }) {
      return {
        ...state,
        status: payload.status
      };
    }
  }
};
