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
        window.sessionStorage.setItem("token",response.data.token);
        window.sessionStorage.setItem("userName",response.data.userName);
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
        message.error("Incorrect user name or password");
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
       yield put(
        routerRedux.push({
          pathname: "/user/login",
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
