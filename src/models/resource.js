import { message } from "antd";
import {
  getAllResources,
  findResource,
  updateResource,
  deleteResource,
  addResource
} from "../services/api";
import {getIntlContent} from "../utils/IntlUtils";

export default {
  namespace: "resource",

  state: {
    resourceList: [],
    total: 0
  },

  effects: {
    *fetch(params, { call, put }) {
      const { payload } = params;
      const json = yield call(getAllResources, payload);
      if (json.code === 200) {
        let { page, dataList } = json.data;

        dataList = dataList.map(item => {
          item.key = item.id;
          return item;
        });
        yield put({
          type: "saveResources",
          payload: {
            total: page.totalCount,
            dataList
          }
        });
      }
    },
    *fetchItem(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(findResource, payload);
      if (json.code === 200) {
        const resource = json.data;
        callback(resource);
      }
    },
    *add(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(addResource, payload);
      if (json.code === 200) {
        message.success(getIntlContent('SOUL.COMMON.RESPONSE.ADD.SUCCESS'));
        callback();
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *delete(params, { call, put }) {
      const { payload, fetchValue, callback } = params;
      const { list } = payload;
      const json = yield call(deleteResource, { list });
      if (json.code === 200) {
        message.success(getIntlContent('SOUL.COMMON.RESPONSE.DELETE.SUCCESS'));
        callback();
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *update(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(updateResource, payload);
      if (json.code === 200) {
        message.success(getIntlContent('SOUL.COMMON.RESPONSE.UPDATE.SUCCESS'));
        callback();
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },

    *reload(params, { put }) {
      const { fetchValue } = params;
      const { resourceName, currentPage, pageSize } = fetchValue;
      const payload = { resourceName, currentPage, pageSize };
      yield put({ type: "fetch", payload });
    }
  },

  reducers: {
    saveResources(state, { payload }) {
      return {
        ...state,
        resourceList: payload.dataList,
        total: payload.total
      };
    }
  }
};
