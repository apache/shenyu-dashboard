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
  getAllResources,
  findResource,
  updateResource,
  deleteResource,
  addResource,
  getButtons,
  getMenuTree,
} from "../services/api";
import {getIntlContent} from "../utils/IntlUtils";

export default {
  namespace: "resource",

  state: {
    resourceList: [],
    menuTree: [],
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
    *add(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(addResource, payload);
      if (json.code === 200) {
        message.success(getIntlContent('SHENYU.COMMON.RESPONSE.ADD.SUCCESS'));
        callback();
      } else {
        message.warn(json.message);
      }
    },
    *delete(params, { call }) {
      const { payload, callback } = params;
      const { list } = payload;
      const json = yield call(deleteResource, { list });
      if (json.code === 200) {
        message.success(getIntlContent('SHENYU.COMMON.RESPONSE.DELETE.SUCCESS'));
        callback();
      } else {
        message.warn(json.message);
      }
    },
    *update(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(updateResource, payload);
      if (json.code === 200) {
        message.success(getIntlContent('SHENYU.COMMON.RESPONSE.UPDATE.SUCCESS'));
        callback();
      } else {
        message.warn(json.message);
      }
    },
    *fetchButtons(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(getButtons, payload);
      const resource = json.data;
      callback(resource);
    },
    *fetchMenuTree(_, { call, put }) {
      const json = yield call(getMenuTree);
      if (json.code === 200) {
        const menuTree = json.data;
        yield put({
          type: "saveMenuTree",
          payload: {
            menuTree
          }
        });
      }
    },
  },

  reducers: {
    saveResources(state, { payload }) {
      return {
        ...state,
        resourceList: payload.dataList,
        total: payload.total
      };
    },
    saveMenuTree(state, { payload }) {
      return {
        ...state,
        menuTree: payload.menuTree
      };
    }
  }
};
