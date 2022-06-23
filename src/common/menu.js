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

import { isUrl } from "../utils/utils";
import { getIntlContent } from "../utils/IntlUtils";

export const menuData = [
  {
    name: getIntlContent("SHENYU.MENU.PLUGIN.LIST"),
    icon: "dashboard",
    path: "plug",
    locale: "SHENYU.MENU.PLUGIN.LIST",
    children: []
  },
  {
    name: getIntlContent("SHENYU.MENU.SYSTEM.MANAGMENT"),
    icon: "setting",
    path: "system",
    locale: "SHENYU.MENU.SYSTEM.MANAGMENT",
    children: [
      {
        name: getIntlContent("SHENYU.MENU.SYSTEM.MANAGMENT.ROLE"),
        path: "role",
        locale: "SHENYU.MENU.SYSTEM.MANAGMENT.ROLE"
      },
      {
        name: getIntlContent("SHENYU.MENU.SYSTEM.MANAGMENT.USER"),
        path: "manage",
        locale: "SHENYU.MENU.SYSTEM.MANAGMENT.USER"
      },
      {
        name: getIntlContent("SHENYU.MENU.SYSTEM.MANAGMENT.RESOURCE"),
        path: "resource",
        locale: "SHENYU.MENU.SYSTEM.MANAGMENT.RESOURCE"
      }
    ]
  },
  {
    name: getIntlContent("SHENYU.MENU.CONFIG.MANAGMENT"),
    icon: "setting",
    path: "config",
    locale: "SHENYU.MENU.CONFIG.MANAGMENT",
    children: [
      {
        name: getIntlContent("SHENYU.MENU.SYSTEM.MANAGMENT.PLUGIN"),
        path: "plugin",
        locale: "SHENYU.MENU.SYSTEM.MANAGMENT.PLUGIN"
      },
      {
        name: getIntlContent("SHENYU.PLUGIN.PLUGINHANDLE"),
        path: "pluginhandle",
        locale: "SHENYU.PLUGIN.PLUGINHANDLE"
      },
      {
        name: getIntlContent("SHENYU.MENU.SYSTEM.MANAGMENT.AUTHEN"),
        path: "auth",
        locale: "SHENYU.MENU.SYSTEM.MANAGMENT.AUTHEN"
      },
      {
        name: getIntlContent("SHENYU.MENU.SYSTEM.MANAGMENT.METADATA"),
        path: "metadata",
        locale: "SHENYU.MENU.SYSTEM.MANAGMENT.METADATA"
      },
      {
        name: getIntlContent("SHENYU.MENU.SYSTEM.MANAGMENT.DICTIONARY"),
        path: "dict",
        locale: "SHENYU.MENU.SYSTEM.MANAGMENT.DICTIONARY"
      }
    ]
  },
  {
    name: getIntlContent("SHENYU.MENU.DOCUMENT"),
    icon: "file-text",
    path: "document",
    locale: "SHENYU.MENU.DOCUMENT",
    children: [
      {
        name: getIntlContent("SHENYU.MENU.DOCUMENT.APIDOC"),
        path: "apidoc",
        locale: "SHENYU.MENU.DOCUMENT.APIDOC"
      }
    ]
  }
];
function formatter(data, parentPath = "/", parentAuthority) {
  return data.map(item => {
    let { path } = item;
    if (!isUrl(path)) {
      path = parentPath + item.path;
    }
    const result = {
      ...item,
      path,
      authority: item.authority || parentAuthority
    };
    if (item.children) {
      result.children = formatter(
        item.children,
        `${parentPath}${item.path}/`,
        item.authority
      );
    }

    return result;
  });
}

export const getMenuData = () => formatter(menuData);
