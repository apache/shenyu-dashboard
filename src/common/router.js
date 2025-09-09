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

import React, { createElement } from "react";
import { Spin } from "antd";
import pathToRegexp from "path-to-regexp";
import Loadable from "react-loadable";
import { getMenuData } from "./menu";

let routerDataCache;

const modelNotExisted = (app, model) =>
  // eslint-disable-next-line
  !app._models.some(({ namespace }) => {
    return namespace === model.substring(model.lastIndexOf("/") + 1);
  });

// wrapper of dynamic
const dynamicWrapper = (app, models, component) => {
  // register models
  models.forEach((model) => {
    if (modelNotExisted(app, model)) {
      // eslint-disable-next-line
      app.model(require(`../models/${model}`).default);
    }
  });

  // () => require('module')
  // transformed by babel-plugin-dynamic-import-node-sync
  if (component.toString().indexOf(".then(") < 0) {
    return (props) => {
      if (!routerDataCache) {
        routerDataCache = getRouterData(app);
      }
      return createElement(component().default, {
        ...props,
        routerData: routerDataCache,
      });
    };
  }
  // () => import('module')
  return Loadable({
    loader: () => {
      if (!routerDataCache) {
        routerDataCache = getRouterData(app);
      }
      return component().then((raw) => {
        const Component = raw.default || raw;
        return (props) =>
          createElement(Component, {
            ...props,
            routerData: routerDataCache,
          });
      });
    },
    loading: () => {
      return <Spin size="large" className="global-spin" />;
    },
  });
};

function getFlatMenuData(menus) {
  let keys = {};
  menus.forEach((item) => {
    if (item.children) {
      keys[item.path] = { ...item };
      keys = { ...keys, ...getFlatMenuData(item.children) };
    } else {
      keys[item.path] = { ...item };
    }
  });
  return keys;
}

export const getRouterData = (app) => {
  const routerConfig = {
    "/": {
      component: dynamicWrapper(
        app,
        ["user", "login"],
        () => import("../layouts/BasicLayout"),
      ),
    },
    "/plug/Mcp/mcpServer": {
      component: dynamicWrapper(
        app,
        ["mcpServer"],
        () => import("../routes/Plugin/McpServer"),
      ),
    },
    "/home": {
      component: dynamicWrapper(app, [], () => import("../routes/Home")),
    },
    "/plug/Proxy/tcp": {
      component: dynamicWrapper(
        app,
        ["discovery"],
        () => import("../routes/Plugin/Discovery"),
      ),
    },
    "/plug/:index/:id": {
      component: dynamicWrapper(
        app,
        ["common"],
        () => import("../routes/Plugin/Common"),
      ),
    },
    "/system/role": {
      component: dynamicWrapper(
        app,
        ["role"],
        () => import("../routes/System/Role"),
      ),
    },
    "/system/manage": {
      component: dynamicWrapper(
        app,
        ["manage", "dataPermission"],
        () => import("../routes/System/User"),
      ),
    },
    "/system/resource": {
      component: dynamicWrapper(
        app,
        ["resource"],
        () => import("../routes/System/Resource"),
      ),
    },
    "/system/alert": {
      component: dynamicWrapper(
        app,
        ["alert"],
        () => import("../routes/System/Alert"),
      ),
    },
    "/system/scale": {
      component: dynamicWrapper(
        app,
        ["scale"],
        () => import("../routes/System/Scale"),
      ),
    },
    "/config/namespace": {
      component: dynamicWrapper(
        app,
        ["namespace"],
        () => import("../routes/System/Namespace"),
      ),
    },
    "/config/metadata": {
      component: dynamicWrapper(
        app,
        ["metadata"],
        () => import("../routes/System/Metadata"),
      ),
    },
    "/config/plugin": {
      component: dynamicWrapper(
        app,
        ["plugin"],
        () => import("../routes/System/Plugin"),
      ),
    },
    "/config/instance": {
      component: dynamicWrapper(
        app,
        ["instance"],
        () => import("../routes/System/Instance"),
      ),
    },
    "/config/registry": {
      component: dynamicWrapper(
        app,
        ["registry"],
        () => import("../routes/System/Registry"),
      ),
    },
    "/config/namespacePlugin": {
      component: dynamicWrapper(
        app,
        ["namespacePlugin"],
        () => import("../routes/System/NamespacePlugin"),
      ),
    },
    "/config/pluginhandle": {
      component: dynamicWrapper(
        app,
        ["pluginHandle"],
        () => import("../routes/System/PluginHandle"),
      ),
    },
    "/config/auth": {
      component: dynamicWrapper(
        app,
        ["auth"],
        () => import("../routes/System/AppAuth"),
      ),
    },
    "/config/dict": {
      component: dynamicWrapper(
        app,
        ["shenyuDict"],
        () => import("../routes/System/Dict"),
      ),
    },
    "/exception/403": {
      component: dynamicWrapper(
        app,
        [],
        () => import("../routes/Exception/403"),
      ),
    },
    "/exception/404": {
      component: dynamicWrapper(
        app,
        [],
        () => import("../routes/Exception/404"),
      ),
    },
    "/exception/500": {
      component: dynamicWrapper(
        app,
        [],
        () => import("../routes/Exception/500"),
      ),
    },
    "/exception/trigger": {
      component: dynamicWrapper(
        app,
        ["error"],
        () => import("../routes/Exception/triggerException"),
      ),
    },
    "/user": {
      component: dynamicWrapper(app, [], () => import("../layouts/UserLayout")),
    },
    "/user/login": {
      component: dynamicWrapper(
        app,
        ["login"],
        () => import("../routes/User/Login"),
      ),
    },
    "/document/apidoc": {
      component: dynamicWrapper(
        app,
        [],
        () => import("../routes/Document/ApiDoc"),
      ),
    },
  };
  // Get name from ./menu.js or just set it in the router data.
  const menuData = getFlatMenuData(getMenuData());
  // Route configuration data
  // eg. {name,authority ...routerConfig }
  const routerData = {};
  // The route matches the menu
  Object.keys(routerConfig).forEach((path) => {
    // Regular match item name
    // eg.  router /user/:id === /user/chen
    const pathRegexp = pathToRegexp(path);
    const menuKey = Object.keys(menuData).find((key) =>
      pathRegexp.test(`${key}`),
    );
    let menuItem = {};
    // If menuKey is not empty
    if (menuKey) {
      menuItem = menuData[menuKey];
    }
    let router = routerConfig[path];
    // If you need to configure complex parameter routing,
    // https://github.com/ant-design/ant-design-pro-site/blob/master/docs/router-and-nav.md#%E5%B8%A6%E5%8F%82%E6%95%B0%E7%9A%84%E8%B7%AF%E7%94%B1%E8%8F%9C%E5%8D%95
    // eg . /list/:type/user/info/:id
    router = {
      ...router,
      name: router.name || menuItem.name,
      authority: router.authority || menuItem.authority,
      hideInBreadcrumb: router.hideInBreadcrumb || menuItem.hideInBreadcrumb,
    };
    routerData[path] = router;
  });
  return routerData;
};
