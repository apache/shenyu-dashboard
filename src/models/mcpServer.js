import { message } from "antd";
import {
  fetchMcpServer,
  addMcpServer,
  updateMcpServer,
  deleteMcpServer,
} from "../services/api";

export default {
  namespace: "mcpServer",

  state: {
    list: [],
    total: 0,
    currentPage: 1,
    pageSize: 12,
  },

  effects: {
    *fetch({ payload }, { call, put }) {
      const response = yield call(fetchMcpServer, payload);
      if (response) {
        yield put({
          type: "saveList",
          payload: {
            list: response.data,
            total: response.total,
            currentPage: payload.currentPage,
            pageSize: payload.pageSize,
          },
        });
      }
    },
    *add({ payload, callback }, { call, put }) {
      const response = yield call(addMcpServer, payload);
      if (response) {
        message.success("添加成功");
        yield put({ type: "reload" });
      }
      if (callback) callback();
    },
    *update({ payload, callback }, { call, put }) {
      const response = yield call(updateMcpServer, payload);
      if (response) {
        message.success("更新成功");
        yield put({ type: "reload" });
      }
      if (callback) callback();
    },
    *delete({ payload, callback }, { call, put }) {
      const response = yield call(deleteMcpServer, payload);
      if (response) {
        message.success("删除成功");
        yield put({ type: "reload" });
      }
      if (callback) callback();
    },
    *reload(_, { put, select }) {
      const { currentPage, pageSize } = yield select(
        (state) => state.mcpServer,
      );
      yield put({
        type: "fetch",
        payload: { currentPage, pageSize },
      });
    },
  },

  reducers: {
    saveList(state, { payload }) {
      return {
        ...state,
        list: payload.list,
        total: payload.total,
        currentPage: payload.currentPage,
        pageSize: payload.pageSize,
      };
    },
  },
};
