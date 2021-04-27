import { message } from "antd";
import {
  getDataPermisionSelectors,
  getDataPermisionRules,
  addDataPermisionSelector,
  addDataPermisionRule,
  deleteDataPermisionSelector,
  deleteDataPermisionRule,
} from "../services/api";

export default {
  namespace: "dataPermission",

  state: {
  },

  effects: {
    *fetchDataPermisionSelectors(params, { call }) {
      const { payload, callback  } = params;
      const json = yield call(getDataPermisionSelectors, payload);
      if (json.code === 200) {
        let { page, dataList } = json.data;

        dataList = dataList.map(item => {
          item.key = item.id;
          return item;
        });
        callback({
          total: page.totalCount,
          dataList
        });
      } else {
        callback({
          total: 0,
          dataList:[]
        })
      }
    },
    *addPermisionSelector(params, { call }) {
        const { payload, callback } = params;
        const json = yield call(addDataPermisionSelector, payload);
        if (json.code === 200) {
          callback();
        } else {
          message.warn(json.message);
        }
    },
    *deletePermisionSelector(params, { call }) {
        const { payload, callback } = params;
        const json = yield call(deleteDataPermisionSelector, payload);
        if (json.code === 200) {
            callback();
        } else {
            message.warn(json.message);
        }
    },
    *fetchDataPermisionRules(params, { call }) {
        const { payload, callback } = params;
        const json = yield call(getDataPermisionRules, payload);
        if (json.code === 200) {
          let { page, dataList } = json.data;
  
          dataList = dataList.map(item => {
            item.key = item.id;
            return item;
          });
          callback({
            total: page.totalCount,
            dataList
          });
        } else {
          callback({
            total: 0,
            dataList:[]
          })
        }
    },
    *addPermisionRule(params, { call }) {
        const { payload, callback } = params;
        const json = yield call(addDataPermisionRule, payload);
        if (json.code === 200) {
        callback();
        } else {
        message.warn(json.message);
        }
    },
    *deletePermisionRule(params, { call }) {
        const { payload, callback } = params;
        const json = yield call(deleteDataPermisionRule, payload);
        if (json.code === 200) {
            callback();
        } else {
            message.warn(json.message);
        }
    },
  },

  reducers: {
  }
};
