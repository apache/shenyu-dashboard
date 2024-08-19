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

import React from "react";
import { refreshAuthMenus } from "./AuthRoute";
import AddModal from "../routes/System/NamespacePlugin/AddModal";

export function getUpdateModal({
  pluginId,
  namespaceId,
  dispatch,
  fetchValue,
  callback,
  updatedCallback,
  canceledCallback,
}) {
  dispatch({
    type: "namespacePlugin/fetchItem",
    payload: {
      pluginId,
      namespaceId,
    },
    callback: (plugin) => {
      dispatch({
        type: "namespacePlugin/fetchByPluginId",
        payload: {
          pluginId: plugin.pluginId,
          type: "3",
        },
        callback: (pluginConfigList) => {
          callback(
            <AddModal
              disabled={true}
              {...plugin}
              {...pluginConfigList}
              handleOk={(values) => {
                const { enabled, name, config, sort } = values;
                dispatch({
                  type: "namespacePlugin/update",
                  payload: {
                    config,
                    pluginId: plugin.pluginId,
                    enabled,
                    namespaceId,
                    sort,
                    name,
                  },
                  fetchValue,
                  callback: () => {
                    if (updatedCallback) {
                      updatedCallback(values);
                    }
                    refreshAuthMenus({ dispatch });
                  },
                });
              }}
              handleCancel={canceledCallback}
            />,
          );
        },
      });
    },
  });
}

export function updateNamespacePluginsEnabled({
  list,
  enabled,
  namespaceId,
  dispatch,
  fetchValue,
  callback,
}) {
  dispatch({
    type: "namespacePlugin/updateEn",
    payload: {
      list,
      enabled,
      namespaceId,
    },
    fetchValue,
    callback: () => {
      if (callback) {
        callback();
      }
      refreshAuthMenus({ dispatch });
    },
  });
}
