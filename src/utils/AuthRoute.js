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

import React, { Component } from "react";
import { connect } from "dva";
import { Redirect } from "react-router-dom";
import { Route } from "dva/router";
import { Spin } from "antd";
import { filterTree } from "./utils";

// not check route url
const notCheckRouteUrl = ["/", "/home"];

// menuItem cache
let menuCache = [];
// menus cache
let authMenusCache = {};

function formatRouteUrl(routeUrl) {
  if (routeUrl.startsWith("/plug/")) {
    const [flag, plug, , ...id] = routeUrl.split("/");
    return [flag, plug, ...id].join("/");
  }
  return routeUrl;
}

/**
 *  reset authorized menu cache
 *
 */
export function resetAuthMenuCache() {
  menuCache = [];
  authMenusCache = {};
}

/**
 *  Check the menu's permission
 *
 * @param {string} routeUrl
 * @param {Array} permissions
 */
export function checkMenuAuth(routeUrl, permissions) {
  let routeUrlCopy = formatRouteUrl(routeUrl);

  if (
    routeUrlCopy.startsWith("/exception/") ||
    notCheckRouteUrl.some(e => e === routeUrlCopy)
  ) {
    return routeUrl;
  }
  if (permissions && permissions.menu && permissions.menu.length > 0) {
    if (!menuCache || menuCache.length === 0) {
      permissions.menu.forEach(m => {
        filterTree(m, menuItem => {
          menuCache.push(menuItem);
        });
      });
    }
    if (menuCache && menuCache.some(e => e.url === routeUrlCopy)) {
      return routeUrl;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

/**
 *  get all authorized menus
 *  if authMenusCache is not empty,return from cache,
 *  else return from building
 *
 * @param {Array} menus
 * @param {Array} permissions
 * @param {Boolean} beginCache
 */
export function getAuthMenus(menus, permissions, beginCache) {
  let authMenus = [];
  if (beginCache && authMenusCache && Object.keys(authMenusCache).length > 0) {
    let locale = window.sessionStorage.getItem("locale");
    let authCacheMenus = authMenusCache[locale];
    if (authCacheMenus && authCacheMenus.length > 0) {
      return authCacheMenus;
    }
  }
  if (menus && menus.length > 0) {
    setMenuIconAndSort(menus, permissions);
    authMenus = JSON.parse(JSON.stringify(menus));
    authMenus.forEach(m => {
      if (checkMenuAuth(m.path, permissions)) {
        filterTree(m, menuItem => {
          if (menuItem.children && menuItem.children.length > 0) {
            let newChildren = [];
            menuItem.children.forEach(menuChildItem => {
              if (checkMenuAuth(menuChildItem.path, permissions)) {
                newChildren.push(menuChildItem);
              }
            });
            menuItem.children = newChildren;
          }
        });
      } else {
        m.deleted = true;
      }
    });
    authMenus = authMenus.filter(e => !e.deleted);
  }
  if (beginCache) {
    let locale = window.sessionStorage.getItem("locale");
    authMenusCache[locale] = authMenus;
  }
  return authMenus;
}

const setMenuIconAndSort = (menus, permissions) => {
  if (permissions && Array.isArray(permissions.menu)) {
    const iconAndSortMap = (function getIconAndSortMap(menuArr, mapObj) {
      menuArr.forEach(menu => {
        mapObj[menu.url] = menu;
        if (Array.isArray(menu.children)) {
          getIconAndSortMap(menu.children, mapObj);
        }
      });
      return mapObj;
    })(permissions.menu, {});

    (function structureMenu(menuArr) {
      if (Array.isArray(menuArr)) {
        menuArr.forEach(menu => {
          const currentMenu = iconAndSortMap[formatRouteUrl(menu.path)];
          // console.log(menu, currentMenu, menu.path);
          if (
            currentMenu &&
            currentMenu.meta.icon &&
            !/^\/plug\/\d+$/.test(menu.path)
          ) {
            menu.icon = currentMenu.meta.icon;
          }

          if (
            currentMenu &&
            currentMenu.sort &&
            !menu.path.startsWith("/plug/")
          ) {
            menu.sort = currentMenu.sort;
          }
          // if (menu.sort === undefined) {
          //   menu.sort = 999;
          // }
          if (menu.children) {
            structureMenu(menu.children);
          }
        });
        menuArr.sort((a, b) => a.sort - b.sort);
      }
    })(menus);
  }
};

@connect(({ global, loading }) => ({
  global,
  loading: loading.effects["global/fetchPermission"]
}))
export default class AuthRoute extends Component {
  componentWillMount() {
    const {
      global: { permissions },
      loading,
      path
    } = this.props;
    if (
      (!permissions || !permissions.menu || permissions.menu.length === 0) &&
      !loading &&
      path === "/"
    ) {
      this.fetchPermissions();
    }
  }

  fetchPermissions = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "global/fetchPermission",
      payload: {
        callback: () => {
          resetAuthMenuCache();
        }
      }
    });
  };

  render() {
    const {
      loading,
      path,
      component,
      global: { permissions },
      redirectPath,
      location: { pathname }
    } = this.props;
    if (loading) {
      return (
        <Spin
          tip="Loading..."
          style={{ position: "relative", left: "50%", top: "50%" }}
        />
      );
    } else {
      let paths = path;
      if (paths.indexOf("/:") > -1) {
        paths = pathname;
      }
      if (checkMenuAuth(paths, permissions)) {
        return <Route path={path} component={component} />;
      } else {
        return (
          <Route render={() => <Redirect to={{ pathname: redirectPath }} />} />
        );
      }
    }
  }
}
