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

import "./polyfill";
import "@douyinfe/semi-ui/lib/es/_base/base.css";
import React from "react";
import { Provider } from "react-redux";
import { createHashHistory as createHistory } from "history";
import renderApp from "./runtime/render";
import createApp from "./runtime/createApp";
import globalModel from "./models/global";
import { getRouterData } from "./common/router";
import RouterConfig from "./router";

// user BrowserHistory
// import createHistory from 'history/createBrowserHistory';
import createLoading from "./utils/loading";
import { initIntl } from "./utils/IntlUtils";

// import 'moment/locale/zh-cn';
// import './rollbar';
import "./index.less";
import { emit } from "./utils/emit";
import { setRequestDispatch } from "./utils/request";

const middlewares = [];
// if (process.env.NODE_ENV === `development`) {
//   const { logger } = require(`redux-logger`);

//   middlewares.push(logger);
// }

/** get session storage, falling back to the browser language */
const browserLocale = window.navigator.language || "";
const locale =
  window.sessionStorage.getItem("locale") ||
  (browserLocale.startsWith("zh") ? "zh-CN" : "en-US");
initIntl(locale);
window.sessionStorage.setItem("locale", locale);

emit.on("change_language", (lang) => initIntl(lang));

// 1. Initialize
const history = createHistory();
const app = createApp({
  history,
  onAction: middlewares,
});

// 2. Plugins
app.use(createLoading());

// 3. Register global model
app.model(globalModel);

// 4. Register route models before store startup and rendering.
const routerData = getRouterData(app);

// 5. Start
setRequestDispatch((action) => app._store.dispatch(action)); // eslint-disable-line no-underscore-dangle
app.start();
const store = app._store; // eslint-disable-line no-underscore-dangle
renderApp(
  <Provider store={store}>
    <RouterConfig history={history} routerData={routerData} />
  </Provider>,
  document.getElementById("root"),
);

export default store;
