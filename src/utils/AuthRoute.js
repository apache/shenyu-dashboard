import React, { Component } from 'react';
import { connect } from 'dva';
import { Redirect } from 'react-router-dom';
import { Route } from 'dva/router';
import { Spin } from 'antd';
import { filterTree } from './utils';

// not check route url
const notCheckRouteUrl = ["/", "/home", "/plug/:id"];

// menuItem cache  
let menuCache = [];
// menus cache  
let authMenusCache = {};

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
  if (routeUrl.startsWith("/exception/") || notCheckRouteUrl.some(e => e === routeUrl)) {
    return routeUrl
  }
  if (permissions && permissions.menu && permissions.menu.length > 0) {
    if (!menuCache || menuCache.length === 0) {
      permissions.menu.forEach(m => {
        filterTree(m, (menuItem) => {
          menuCache.push(menuItem);
        })
      })
    }
    if (menuCache && menuCache.some(e => e.url === routeUrl)) {
      return routeUrl;
    }else{
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
  if(beginCache && authMenusCache && Object.keys(authMenusCache).length > 0){
    let locale = window.sessionStorage.getItem("locale");
    let authCacheMenus =  authMenusCache[locale];
    if(authCacheMenus && authCacheMenus.length > 0){
      return authCacheMenus;
    }
  }  
  if (menus && menus.length > 0) {
    setMenuIconAndSort(menus, permissions);
    authMenus = JSON.parse(JSON.stringify(menus))
    authMenus.forEach((m) => {
      if (checkMenuAuth(m.path, permissions)) {
        filterTree(m, (menuItem) => {
          if (menuItem.children && menuItem.children.length > 0) {
            let newChildren = [];
            menuItem.children.forEach((menuChildItem) => {
              if (checkMenuAuth(menuChildItem.path, permissions)) {
                newChildren.push(menuChildItem);
              }
            })
            menuItem.children = newChildren;
          }
        })
      } else {
        m.deleted = true;
      }
    });
    authMenus = authMenus.filter(e=>!e.deleted);
  }
  if(beginCache){
    let locale = window.sessionStorage.getItem("locale");
    authMenusCache[locale] = authMenus;
  }
  return authMenus;
}

const setMenuIconAndSort = (menus, permissions) => {
  if (permissions && permissions.menu && permissions.menu.length > 0) {
    menus.forEach(menuTree =>{
      if(menuTree.children && menuTree.children.length > 0){
        menuTree.children.forEach(menu => {
          permissions.menu.forEach(m => {
            if(m.url === menuTree.path){
              if(m.meta.icon){
                menuTree.icon = m.meta.icon;
              }
              menuTree.sort = m.sort;
            }

            if(m.children && m.children.length > 0){
              m.children.forEach(mChild => {
                if(menu.path === mChild.url){
                  if(mChild.meta.icon){
                    menu.icon = mChild.meta.icon;
                  }
                  if(!isNaN(mChild.sort)){
                    menu.sort = mChild.sort;
                  }
                }
              })
            }
          })
          if(isNaN(menu.sort)){
            menu.sort = 999;
          }
        })
        menuTree.children.sort((a,b) => a.sort - b.sort);
      }
    })
    menus.sort((a,b) => a.sort - b.sort);
  }
}

@connect(({ global, loading }) => ({
  global,
  loading: loading.effects["global/fetchPermission"]
}))
export default class AuthRoute extends Component {

  componentWillMount() {
    const { global: { permissions }, loading, path } = this.props;
    if ((!permissions || !permissions.menu || permissions.menu.length === 0) && !loading && path === "/") {
      this.fetchPermissions();
    }
  }

  fetchPermissions = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchPermission',
      payload: {
        callback: () => {
          resetAuthMenuCache();
        }
      }
    });
  }

  render() {
    const { loading, path, component, global: { permissions }, redirectPath, location: { pathname } } = this.props;
    if (loading) {
      return <Spin tip="Loading..." style={{ position: "relative", left: "50%", top: "50%" }} />;
    } else {
      let paths = path;
      if(paths.indexOf("/:") > -1){
        paths = pathname
      }
      if (checkMenuAuth(paths, permissions)) {
        return <Route path={path} component={component} />
      } else {
        return <Route render={() => <Redirect to={{ pathname: redirectPath }} />} />
      }
    }
  }
}