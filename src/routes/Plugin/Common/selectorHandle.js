/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const isDivideUpstreamsRequiresForPlugin = (pluginId) =>
  ["8"].includes(pluginId);

export const buildHandle = (pluginHandleList, values, pluginId) => {
  const handle = [];
  pluginHandleList.forEach((handleList, index) => {
    handle[index] = {};
    const { keys, divideUpstreams, gray } = values;
    handleList.forEach((item) => {
      if (isDivideUpstreamsRequiresForPlugin(pluginId)) {
        if (Array.isArray(divideUpstreams) && divideUpstreams.length) {
          handle[index].divideUpstreams = keys.map(
            (key) => divideUpstreams[key],
          );
        }
        handle[index][item.field] = values[item.field];
        handle[index].gray = gray;
        delete values[item.field];
        delete values.divideUpstreams;
        delete values.gray;
        delete values.keys;
      } else {
        handle[index][item.field] = values[item.field + index];
        delete values[item.field + index];
      }
    });
  });
  return handle;
};
