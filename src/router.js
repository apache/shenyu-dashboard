import React from 'react';
import { routerRedux, Route, Switch } from 'dva/router';
import { ConfigProvider } from 'antd';
import enUS from 'antd/lib/locale-provider/en_US';
import { getRouterData } from './common/router';
import AuthRoute from './utils/AuthRoute';

const { ConnectedRouter } = routerRedux;

function RouterConfig({ history, app }) {

  const routerData = getRouterData(app);
  const UserLayout = routerData['/user'].component;
  const BasicLayout = routerData['/'].component;

  return (
    <ConfigProvider locale={enUS}>
      <ConnectedRouter history={history}>
        <Switch>
          <Route path="/user" component={UserLayout} />
          <AuthRoute path="/" component={BasicLayout} redirectPath='/user/login' />
        </Switch>
      </ConnectedRouter>
    </ConfigProvider>
  );
}

export default RouterConfig;
