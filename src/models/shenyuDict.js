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
    shenyuDictMap: {},
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
    *fetchByType(params, {call, put, select }) {
      const {payload} = params;
      let callback = payload.callBack;
      let shenyuDictMap = yield select((state)=>state.shenyuDict.shenyuDictMap || {});
      if(shenyuDictMap[payload.type]) {
        callback(shenyuDictMap[payload.type])
      } else {
        const json = yield call(fetchShenYuDictByType, payload);
        if (json.code === 200) {
          let dataList = json.data.map(item => {
            item.key = item.id;
            return item;
          });
          shenyuDictMap[payload.type] = dataList;
          yield put({
            type: "saveShenYuDictMap",
            payload: {
              shenyuDictMap
            }
          });
          callback(dataList);
        }
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

    saveShenYuDictMap(state, { payload }) {
      return {
        ...state,
        shenyuDictMap: payload.shenyuDictMap
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
