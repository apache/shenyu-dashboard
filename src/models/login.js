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

import { message } from "../components/ui/feedback";
import { routerRedux } from "../runtime/router";
// import { stringify } from "qs";
import { queryLogin } from "../services/api";
import { defaultNamespaceId } from "../components/_utils/utils";
import { resetAuthMenuCache } from "../utils/AuthRoute";

export default {
  namespace: "login",

  state: {
    status: undefined,
  },

  effects: {
    *login({ payload }, { call, put }) {
      const { callback } = payload;
      const token = window.sessionStorage.getItem("token");
      let response;
      let requestError;
      try {
        response = yield call(queryLogin, payload);
      } catch (error) {
        requestError = error;
        response = error.response?.data ?? error.response;
      }
      if (token !== window.sessionStorage.getItem("token")) {
        return;
      }
      if (callback) {
        yield call(callback, response);
      }

      // Login successfully
      if (response?.code === 200 && response.data?.token) {
        yield put({
          type: "changeLoginStatus",
          payload: {
            status: true,
            currentAuthority: "admin",
          },
        });
        window.sessionStorage.setItem("token", response.data.token);
        window.sessionStorage.setItem("userName", response.data.userName);
        window.sessionStorage.setItem("userId", response.data.id);
        yield put({ type: "global/resetSession" });
        yield put({ type: "resource/resetSession" });
        resetAuthMenuCache();
        // Always initialize navigation for the new session, even when an old
        // permission request is still loading in the same application.
        yield put({
          type: "global/saveCurrentNamespaceId",
          payload: defaultNamespaceId,
        });
        yield put({ type: "global/fetchNamespaces" });
        yield put({ type: "global/fetchPermission" });
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
        if (response?.code === 404) {
          message.error("Incorrect user name or password");
        } else {
          message.error(
            response?.message || requestError?.message || "Login failed",
          );
        }
      }
    },
    *logout(_, { put }) {
      window.sessionStorage.removeItem("token");
      window.sessionStorage.removeItem("userName");
      window.sessionStorage.removeItem("userId");
      window.sessionStorage.removeItem("currentNamespaceId");
      yield put({ type: "global/resetSession" });
      yield put({ type: "resource/resetSession" });
      resetAuthMenuCache();
      yield put({
        type: "changeLoginStatus",
        payload: {
          status: false,
          currentAuthority: "",
        },
      });
      yield put(
        routerRedux.push({
          pathname: "/user/login",
          /* search: stringify({
            redirect: window.location.href
          }) */
        }),
      );
    },
  },

  reducers: {
    changeLoginStatus(state, { payload }) {
      return {
        ...state,
        status: payload.status,
      };
    },
  },
};
