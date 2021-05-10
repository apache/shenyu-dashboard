import { message } from "antd";
import {
  addShenYuDict,
  batchDeleteShenYuDict,
  fetchShenYuDicts,
  findShenYuDict,
  updateShenYuDict,
  fetchShenYuDictByType,
  updateShenYuDictEnabled,
} from "../services/api";
import {getIntlContent} from "../utils/IntlUtils";


export default {
  namespace: "shenyuDict",

  state: {
    shenyuDictList: [],
    total: 0
  },

  effects: {
    * fetch(params, {call, put}) {
      const {payload} = params;
      const json = yield call(fetchShenYuDicts, payload);
      if (json.code === 200) {
        let {page, dataList} = json.data;
        dataList = dataList.map(item => {
          item.key = item.id;
          return item;
        });
        yield put({
          type: "saveShenYuDicts",
          payload: {
            total: page.totalCount,
            dataList
          }
        });
      }
    },
    *add(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(addShenYuDict, payload);
      if (json.code === 200) {
        message.success(getIntlContent('SHENYU.COMMON.RESPONSE.ADD.SUCCESS'));
        callback();
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *fetchItem(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(findShenYuDict, payload);
      if (json.code === 200) {
        const shenyuDict = json.data;
        callback(shenyuDict);
      }
    },
    *update(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(updateShenYuDict, payload);
      if (json.code === 200) {
        message.success(getIntlContent('SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS'));
        callback();
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *delete(params, { call, put }) {
      const { payload, fetchValue, callback } = params;
      const { list } = payload;
      const json = yield call(batchDeleteShenYuDict, { list });
      if (json.code === 200) {
        message.success(getIntlContent('SHENYU.COMMON.RESPONSE.DELETE.SUCCESS'));
        callback();
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *updateEn(params, {call, put}) {
      const {payload,fetchValue,callback} = params;
      const json = yield call (updateShenYuDictEnabled,payload);
      if(json.code===200){
        message.success(getIntlContent('SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS'));
        callback();
        yield put({type: "reload", fetchValue});
      } else {
        message.warn(json.message)
      }
    },
    * fetchByType(params, {call}) {
      const {payload} = params;
      let callback = payload.callBack;
      const json = yield call(fetchShenYuDictByType, payload);
      if (json.code === 200) {
        let dataList = json.data.map(item => {
          item.key = item.id;
          return item;
        });
        callback(dataList);
      }
    },
  },
  reducers: {
    saveShenYuDicts(state, { payload }) {
      return {
        ...state,
        shenyuDictList: payload.dataList,
        total: payload.total
      };
    },

    *reload(params, { put }) {
      const { fetchValue } = params;
      const { type, dictCode, dictName, currentPage, pageSize } = fetchValue;
      const payload = { type, dictCode, dictName, currentPage, pageSize };
      yield put({ type: "fetch", payload });
    },
  }
};
