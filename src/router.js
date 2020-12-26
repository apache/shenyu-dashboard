import React from 'react';
import { routerRedux, Route, Switch } from 'dva/router';
import { ConfigProvider } from 'antd';
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
    <ConfigProvider locale={enUS}>
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
    </ConfigProvider>
  );
}

export default RouterConfig;
