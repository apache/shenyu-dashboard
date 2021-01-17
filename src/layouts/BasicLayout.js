import React from "react";
import PropTypes from "prop-types";
import { Layout, message } from "antd";
import DocumentTitle from "react-document-title";
import { connect } from "dva";
import { Route, Redirect, Switch } from "dva/router";
import { ContainerQuery } from "react-container-query";
import classNames from "classnames";
import pathToRegexp from "path-to-regexp";
import GlobalHeader from "../components/GlobalHeader";
import SiderMenu from "../components/SiderMenu";
import NotFound from "../routes/Exception/404";
import { getRoutes } from "../utils/utils";
import AuthRoute, {checkMenuAuth, getAuthMenus } from "../utils/AuthRoute";
import { getMenuData } from "../common/menu";
import logo from "../assets/logo.svg";

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
      localeName: window.sessionStorage.getItem('locale') ? window.sessionStorage.getItem('locale') : 'en-US',
      pluginsLoaded: false
    }
  }

  getChildContext() {
    const { location, routerData } = this.props;
    return {
      location,
      breadcrumbNameMap: getBreadcrumbNameMap(getMenuData(), routerData)
    };
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: "global/fetchPlugins",
      payload: {
        callback: () => {
          this.setState({
            pluginsLoaded: true
          })
        }
      }
    });
    dispatch({
      type: "global/fetchPlatform"
    });
    const token = window.sessionStorage.getItem("token");
    if(!token){
      this.props.history.push({
        pathname: '/user/login'
      })
    }
  }

  getPageTitle() {
    const { routerData, location } = this.props;
    const { pathname } = location;
    let title = "Gateway Management";
    let currRouterData = null;
    // match params path
    Object.keys(routerData).forEach(key => {
      if (pathToRegexp(key).test(pathname)) {
        currRouterData = routerData[key];
      }
    });
    if (currRouterData && currRouterData.name) {
      title = `Soul - Gateway Management`;
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
      const authorizedPath = Object.keys(routerData).find(
        item => checkMenuAuth(item, permissions) && item !== "/"
      );
      return authorizedPath;
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

  changeLocalName = (value) => {
    const { dispatch } = this.props;
    this.setState({
      localeName: value
    });
    dispatch({
      type: 'global/changeLanguage',
      payload: value,
    })
  }

  render() {
    const { collapsed, routerData, match, location, plugins, permissions, dispatch, } = this.props;
    const { localeName, pluginsLoaded } = this.state;
    const bashRedirect = this.getBaseRedirect();
    const systemRoute = ["divide", "hystrix"];
    let menus = getMenuData();
    plugins.forEach((item) => {
      if (systemRoute.indexOf(item.name) === -1) {
        menus[0].children.push({ name: item.name, path: `/plug/${item.name}`, authority: undefined, id: item.id, locale: (`SOUL.MENU.PLUGIN.${ item.name.toUpperCase()}`) })
      }
    })
    menus = getAuthMenus(menus, permissions, pluginsLoaded);

    const layout = (
      <Layout>
        <SiderMenu
          logo={logo}
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
            style={{
              height: "100%",
              position: "relative"
            }}
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
  collapsed: global.collapsed,
}))(BasicLayout);
