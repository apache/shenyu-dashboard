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
