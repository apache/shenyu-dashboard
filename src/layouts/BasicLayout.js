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
import PropTypes from "prop-types";
import {Layout, message} from "antd";
import DocumentTitle from "react-document-title";
import {connect} from "dva";
import {Redirect, Route, Switch} from "dva/router";
import {ContainerQuery} from "react-container-query";
import classNames from "classnames";
import pathToRegexp from "path-to-regexp";
import GlobalHeader from "../components/GlobalHeader";
import SiderMenu from "../components/SiderMenu";
import NotFound from "../routes/Exception/404";
import {getRoutes} from "../utils/utils";
import AuthRoute, {checkMenuAuth, getAuthMenus} from "../utils/AuthRoute";
import {getMenuData} from "../common/menu";
import logo from "../assets/logo.svg";
import TitleLogo from "../assets/TitleLogo.svg";

const MyContext = React.createContext();

message.config({
  top: 200,
  duration: 2,
  maxCount: 3
});

const { Content, Header } = Layout;

/**
 * Get the redirect address from the menu.
 */
const redirectData = [];
const getRedirect = item => {
  if (item && item.children) {
    if (item.children[0] && item.children[0].path) {
      redirectData.push({
        from: `${item.path}`,
        to: `${item.children[0].path}`
      });
      item.children.forEach(children => {
        getRedirect(children);
      });
    }
  }
};
getMenuData().forEach(getRedirect);

/**
 * Gets the breadcrumb map
 *
 * @param {Object} menuData
 * @param {Object} routerData
 */
const getBreadcrumbNameMap = (menuData, routerData) => {
  const result = {};
  const childResult = {};
  for (const i of menuData) {
    if (!routerData[i.path]) {
      result[i.path] = i;
    }
    if (i.children) {
      Object.assign(childResult, getBreadcrumbNameMap(i.children, routerData));
    }
  }
  return Object.assign({}, routerData, result, childResult);
};

const query = {
  "screen-lg": {
    minWidth: 992,
    maxWidth: 1199
  },
  "screen-xl": {
    minWidth: 1200,
    maxWidth: 1599
  },
  "screen-xxl": {
    minWidth: 1600
  }
};

@connect(({ global, loading }) => ({
  plugins: global.plugins,
  permissions: global.permissions,
  loading: loading.effects["global/fetchPlugins"]
}))
class BasicLayout extends React.PureComponent {
  static childContextTypes = {
    location: PropTypes.object,
    breadcrumbNameMap: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.state = {
      localeName: window.sessionStorage.getItem("locale")
        ? window.sessionStorage.getItem("locale")
        : "en-US",
      pluginsLoaded: false
    };
  }

  getChildContext() {
    const { location, routerData } = this.props;
    return {
      location,
      breadcrumbNameMap: getBreadcrumbNameMap(getMenuData(), routerData)
    };
  }

  componentDidMount() {
    const token = window.sessionStorage.getItem("token");
    if (!token) {
      this.props.history.push({
        pathname: "/user/login"
      });
      return;
    }
    const { dispatch } = this.props;
    dispatch({
      type: "global/fetchPlatform"
    });
    dispatch({
      type: "global/fetchPlugins",
      payload: {
        callback: () => {
          this.setState({
            pluginsLoaded: true
          });
        }
      }
    });
  }

  componentWillUnmount() {
    this.setState = () => {}
  }

  getPageTitle() {
    const { routerData, location } = this.props;
    const { pathname } = location;
    let title = "Apache ShenYu - Gateway Management";
    let currRouterData = null;
    // match params path
    Object.keys(routerData).forEach(key => {
      if (pathToRegexp(key).test(pathname)) {
        currRouterData = routerData[key];
      }
    });
    if (currRouterData && currRouterData.name) {
      title = `Apache ShenYu - ${currRouterData.name}`;
    }
    return title;
  }

  getBaseRedirect = () => {
    // According to the url parameter to redirect
    const urlParams = new URL(window.location.href);

    const redirect = urlParams.searchParams.get("redirect");
    // Remove the parameters in the url
    if (redirect) {
      urlParams.searchParams.delete("redirect");
      window.history.replaceState(null, "redirect", urlParams.href);
    } else {
      const { routerData, permissions } = this.props;
      // get the first authorized route path in routerData
      return Object.keys(routerData).find(
        item => checkMenuAuth(item, permissions) && item !== "/"
      );
    }
    return redirect;
  };

  handleLogout = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "login/logout"
    });

    dispatch({
      type: "global/resetPermission"
    });
  };

  changeLocalName = value => {
    const { dispatch } = this.props;
    this.setState({
      localeName: value
    });
    dispatch({
      type: "global/changeLanguage",
      payload: value
    });
  };

  render() {
    const {
      collapsed,
      routerData,
      match,
      location,
      plugins,
      permissions,
      dispatch
    } = this.props;
    const { localeName, pluginsLoaded } = this.state;
    const bashRedirect = this.getBaseRedirect();
    let menus = getMenuData();

    const menuMap = {};
    plugins.forEach(item => {
      if (menuMap[item.role] === undefined) {
        menuMap[item.role] = [];
      }
      menuMap[item.role].push(item);
    });
    Object.keys(menuMap).forEach((key) => {
      menus[0].children.push({
        name: key,
        path: `/plug/${menuMap[key][0].role}`,
        authority: undefined,
        icon: "unordered-list",
        children: menuMap[key].map(item => {
          const { name } = item;
          return {
            name: name.replace(name[0], name[0].toUpperCase()),
            path: `/plug/${item.role}/${item.name}`,
            authority: undefined,
            id: item.id,
            locale: `SHENYU.MENU.PLUGIN.${item.name.toUpperCase()}`,
            exact: true
          };
        })
      });
    });

    menus = getAuthMenus(menus, permissions, pluginsLoaded);

    // Filter empty menu
    function removeEmptyMenu(menuArr) {
      return menuArr.filter(menu => {
        if (Array.isArray(menu.children)) {
          if (menu.children.length === 0) {
            return false;
          } else {
            menu.children = removeEmptyMenu(menu.children);
          }
        }
        return true;
      });
    }

    if (Array.isArray(menus) && menus.length) {
      removeEmptyMenu(menus);
    }

    const layout = (
      <Layout>
        <SiderMenu
          logo={logo}
          TitleLogo={TitleLogo}
          dispatch={dispatch}
          menuData={menus}
          collapsed={collapsed}
          location={location}
          onCollapse={this.handleMenuCollapse}
        />
        <Layout>
          <Header style={{ padding: 0 }}>
            <GlobalHeader
              logo={logo}
              collapsed={collapsed}
              onCollapse={this.handleMenuCollapse}
              onLogout={this.handleLogout}
              changeLocalName={this.changeLocalName}
            />
          </Header>
          <Content
            className="content-wrap"
            style={{ height: "100%", position: "relative" }}
          >
            <Switch>
              {redirectData.map(item => (
                <Redirect key={item.from} exact from={item.from} to={item.to} />
              ))}
              {getRoutes(match.path, routerData).map(item => (
                <AuthRoute
                  key={item.key}
                  path={item.path}
                  component={item.component}
                  exact={item.exact}
                  authority={item.authority}
                  redirectPath="/exception/403"
                />
              ))}
              <Redirect exact from="/" to={bashRedirect} />
              <Route render={NotFound} />
            </Switch>
          </Content>
        </Layout>
      </Layout>
    );

    return (
      <MyContext.Provider value={localeName}>
        <DocumentTitle title={this.getPageTitle()}>
          <ContainerQuery query={query}>
            {params => (
              <div style={{ minWidth: 1200 }} className={classNames(params)}>
                {layout}
              </div>
            )}
          </ContainerQuery>
        </DocumentTitle>
      </MyContext.Provider>
    );
  }
}

export default connect(({ global = {} }) => ({
  collapsed: global.collapsed
}))(BasicLayout);
