import React, { Component } from 'react';
import { routerRedux, Route, Switch } from 'dva/router';
<<<<<<< HEAD
import { LocaleProvider, message } from 'antd';
=======
import { LocaleProvider } from 'antd';
>>>>>>> 848b18d16733a27859c21045b8416a806a902d3e
import enUS from 'antd/lib/locale-provider/en_US';
import { getRouterData } from './common/router';
import Authorized from './utils/Authorized';
import { getQueryPath } from './utils/utils';

const { ConnectedRouter } = routerRedux;
const { AuthorizedRoute } = Authorized;

function RouterConfig({ history, app }) {

  const routerData = getRouterData(app);
  const UserLayout = routerData['/user'].component;
  const BasicLayout = routerData['/'].component;

  return (
    <LocaleProvider locale={enUS}>
      <ConnectedRouter history={history}>
        <Switch>
          <Route path="/user" component={UserLayout} />
          <AuthorizedRoute
            path="/"
            render={props => <BasicLayout {...props} />}
            authority={['admin', 'user']}
            redirectPath={getQueryPath('/user/login', {
              redirect: window.location.href,
            })}
          />
        </Switch>
      </ConnectedRouter>
    </LocaleProvider>
  );
}

export default RouterConfig;
