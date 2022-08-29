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

import React, { Fragment } from "react";
import { Link, Redirect, Switch, Route } from "dva/router";
import DocumentTitle from "react-document-title";
import { connect } from "dva";
import { Icon, message } from "antd";
import GlobalFooter from "../components/GlobalFooter";
import styles from "./UserLayout.less";
import TitleLogo from "../assets/TitleLogo.svg";
import { getRoutes, getPageQuery, getQueryPath } from "../utils/utils";

message.config({
  top: 200,
  duration: 2,
  maxCount: 3
});
const links = [];

const copyright = (
  <Fragment>
    Copyright <Icon type="copyright" /> {new Date().getFullYear()} The Apache Software Foundation, Licensed under the Apache License, Version 2.0. Apache ShenYu, Apache, the Apache feather logo, the Apache ShenYu logo are trademarks of The Apache Software Foundation.
  </Fragment>
);

function getLoginPathWithRedirectPath() {
  const params = getPageQuery();
  const { redirect } = params;
  return getQueryPath("/user/login", {
    redirect
  });
}

class UserLayout extends React.PureComponent {
  getPageTitle() {
    const { routerData, location } = this.props;
    const { pathname } = location;
    let title = "Login";
    if (routerData[pathname] && routerData[pathname].name) {
      title = `${routerData[pathname].name} - bbex`;
    }
    return title;
  }

  render() {
    const { routerData, match } = this.props;
    return (
      <DocumentTitle title={this.getPageTitle()}>
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.top}>
              <div className={styles.header}>
                <Link to="/">
                  <img alt="logo" className={styles.logo} src={TitleLogo} />
                </Link>
              </div>
              <div className={styles.desc}>
                Apache ShenYu Gateway Management System
              </div>
            </div>
            <Switch>
              {getRoutes(match.path, routerData).map(item => (
                <Route
                  key={item.key}
                  path={item.path}
                  component={item.component}
                  exact={item.exact}
                />
              ))}
              <Redirect from="/user" to={getLoginPathWithRedirectPath()} />
            </Switch>
          </div>
          <GlobalFooter links={links} copyright={copyright} />
        </div>
      </DocumentTitle>
    );
  }
}

export default connect(({ global = {} }) => ({
  collapsed: global.collapsed
}))(UserLayout);
