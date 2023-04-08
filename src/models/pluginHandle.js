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
  addPluginHandle,
  batchDeletePluginHandle,
  getAllPluginHandles,
  findPluginHandle,
  updatePluginHandle,
  fetchPluginHandleByPluginId,
  getPluginDropDownList
} from "../services/api";
import { getIntlContent } from "../utils/IntlUtils";

export default {
  namespace: "pluginHandle",

  state: {
    pluginDropDownList: [],
    pluginHandleList: [],
    total: 0
  },

  effects: {
    *fetch(params, { call, put }) {
      const { payload } = params;
      const json = yield call(getAllPluginHandles, payload);
      if (json.code === 200) {
        let { page, dataList } = json.data;
        dataList = dataList.map(item => {
          item.key = item.id;
          return item;
        });
        yield put({
          type: "savePluginHandles",
          payload: {
            total: page.totalCount,
            dataList
          }
        });
      }
    },
    *add(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(addPluginHandle, payload);
      if (json.code === 200) {
        message.success(getIntlContent("SHENYU.COMMON.RESPONSE.ADD.SUCCESS"));
        callback();
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *fetchItem(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(findPluginHandle, payload);
      if (json.code === 200) {
        const pluginHandle = json.data;
        callback(pluginHandle);
      }
    },
    *update(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(updatePluginHandle, payload);
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS")
        );
        callback();
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },
    *delete(params, { call, put }) {
      const { payload, fetchValue, callback } = params;
      const { list } = payload;
      const json = yield call(batchDeletePluginHandle, { list });
      if (json.code === 200) {
        message.success(
          getIntlContent("SHENYU.COMMON.RESPONSE.DELETE.SUCCESS")
        );
        callback();
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },

    * fetchByPluginId(params, { call }) {
      const { payload } = params;
      let handle = payload.handle;
      let callback = payload.callBack;
      let isHandleArray = payload.isHandleArray;
      let handleJson;
      if (
        handle != null &&
        handle !== "" &&
        typeof handle !== "undefined" &&
        handle.indexOf("{") !== -1
      ) {
        handleJson = JSON.parse(handle);
      }
      const json = yield call(fetchPluginHandleByPluginId, payload);
      if (json.code === 200) {
        let length = 1;
        if (handleJson && Array.isArray(handleJson) && handleJson.length > 0) {
          length = handleJson.length;
        }
        let handleData = [];
        if (isHandleArray && Array.isArray(handleJson)) {
          handleData = handleJson;
        } else {
          handleData = [handleJson];
        }

        let dataList = [];
        let useJSON = false;
        if (json.data && json.data.length > 0) {
          const fieldArr = json.data.map(v => v.field);
          // eslint-disable-next-line no-plusplus
          for (let i = 0; i < length; i++) {
            if (handleData[i]) {
              const keys = Object.keys(handleData[i]);
              let allKeys = [...fieldArr, ...keys];
              allKeys = new Set(allKeys);
              if (allKeys.size !== fieldArr.length) {
                useJSON = true;
              }
            }
            let dataItem = json.data.map(data => {
              let item = { ...data };
              item.key = item.id;
              if (typeof handleData[i] === "undefined") {
                item.value = "";
              } else {
                item.value = handleData[i][item.field];
              }
              if (
                item.extObj != null &&
                item.extObj !== "" &&
                typeof item.extObj !== "undefined" &&
                item.extObj.indexOf("{") !== -1
              ) {
                let extObj = JSON.parse(item.extObj);
                item.required = extObj.required;
                if (extObj.defaultValue || extObj.defaultValue === 0) {
                  if (item.dataType === 1) {
                    item.defaultValue = Number(extObj.defaultValue);
                  } else {
                    item.defaultValue = extObj.defaultValue;
                  }
                }
                item.checkRule = extObj.rule;
                item.placeholder = extObj.placeholder;
              }
              return item;
            });
            dataList.push(dataItem);
          }
        } else {
          useJSON = true;
        }
        callback(dataList, useJSON);
      }
    },

    *fetchPluginList(_, { call, put }) {
      const json = yield call(getPluginDropDownList);
      if (json.code === 200) {
        let data = json.data;
        yield put({
          type: "savePluginDropDownList",
          payload: {
            data
          }
        });
      }
    }
  },
  reducers: {
    savePluginHandles(state, { payload }) {
      return {
        ...state,
        pluginHandleList: payload.dataList,
        total: payload.total
      };
    },

    *reload(params, { put }) {
      const { fetchValue } = params;
      const { pluginId, currentPage, pageSize } = fetchValue;
      const payload = { pluginId, currentPage, pageSize };
      yield put({ type: "fetch", payload });
    },
    savePluginDropDownList(state, { payload }) {
      return {
        ...state,
        pluginDropDownList: payload.data
      };
    }
  }
};
