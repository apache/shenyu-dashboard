import { message } from "antd";
import {
  getAllSelectors,
  getAllRules,
  addSelector,
  findSelector
} from "../services/api";

export default {
  namespace: "waf",

  state: {
    selectorList: [],
    ruleList: [],
    selectorTotal: 0,
    ruleTotal: 0,
    currentSelector: ""
  },

  effects: {
    *fetchSelector(params, { call, put }) {
      const { payload } = params;
      const json = yield call(getAllSelectors, payload);
      if (json.code === 200) {
        let { page, dataList } = json.data;
        dataList = dataList.map(item => {
          item.key = item.id;
          return item;
        });
        yield put({
          type: "saveSelector",
          payload: {
            selectorTotal: page.totalCount,
            selectorList: dataList
          }
        });
      }
    },
    *fetchRule(params, { call, put }) {
      const { payload } = params;
      const json = yield call(getAllRules, payload);
      if (json.code === 200) {
        let { page, dataList } = json.data;
        dataList = dataList.map(item => {
          item.key = item.id;
          return item;
        });
        yield put({
          type: "saveRule",
          payload: {
            ruleTotal: page.totalCount,
            ruleList: dataList
          }
        });
      }
    },
    *addSelector(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(addSelector, payload);
      if (json.code === 200) {
        message.success("添加成功");
        callback();
        yield put({ type: "reload", fetchValue });
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

    *reload(params, { put }) {
      const { fetchValue } = params;
      const { pluginId, currentPage, pageSize } = fetchValue;
      const payload = { pluginId, currentPage, pageSize };
      yield put({ type: "fetch", payload });
    }
  },

  reducers: {
    saveSelector(state, { payload }) {
      return {
        ...state,
        selectorList: payload.selectorList,
        selectorTotal: payload.selectorTotal
      };
    },

    saveRule(state, { payload }) {
      return {
        ...state,
        ruleList: payload.ruleList,
        ruleTotal: payload.ruleTotal
      };
    }
  }
};
