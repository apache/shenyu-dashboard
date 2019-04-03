import { message } from 'antd';
import { getAllAuth, findAuth, updateAuth, deleteAuth, addAuth } from '../services/api';

export default {
  namespace: "auth",

  state: {
    authList: [],
    total: 0
  },

  effects: {
    *fetch(params, { call, put }) {
      const { payload } = params;
      const json = yield call(getAllAuth, payload);
      if (json.code === 200) {
        let { page, dataList } = json.data;
        dataList = dataList.map(item => {
          item.key = item.id;
          return item;
        });
        yield put({
          type: "saveAuths",
          payload: {
            total: page.totalCount,
            dataList
          }
        });
      }
    },
    *fetchItem(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(findAuth, payload);
      if (json.code === 200) {
        const auth = json.data;
        callback(auth);
      }
    },
    *add(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(addAuth, payload);
      if (json.code === 200) {
        message.success("添加成功");
        callback();
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *delete(params, { call, put }) {
      const { payload, fetchValue, callback } = params;
      const { list } = payload;
      const json = yield call(deleteAuth, { list });
      if (json.code === 200) {
        message.success("删除成功");
        callback();
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *update(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(updateAuth, payload);
      if (json.code === 200) {
        message.success("修改成功");
        callback();
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *reload(params, { put }) {
      const { fetchValue } = params;
      const { name, currentPage, pageSize } = fetchValue;
      const payload = { name, currentPage, pageSize };
      yield put({ type: "fetch", payload });
    }
  },

  reducers: {
    saveAuths(state, { payload }) {
      return {
        ...state,
        authList: payload.dataList,
        total: payload.total
      };
    }
  }
};
