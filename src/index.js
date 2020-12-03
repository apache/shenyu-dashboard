import './polyfill';
import dva from 'dva';

import createHistory from 'history/createHashHistory';
// user BrowserHistory
// import createHistory from 'history/createBrowserHistory';
import createLoading from 'dva-loading';
<<<<<<< HEAD
import { initIntl, reloadInit } from './utils/IntlUtils'
=======
import { initIntl } from './utils/IntlUtils'
>>>>>>> 848b18d16733a27859c21045b8416a806a902d3e

// import 'moment/locale/zh-cn';
// import './rollbar';
import './index.less';
import { emit } from './utils/emit';

const middlewares = [];
// if (process.env.NODE_ENV === `development`) {
//   const { logger } = require(`redux-logger`);

//   middlewares.push(logger);
// }
console.log(window.sessionStorage.getItem('locale'))
/** get session storage */
if (window.sessionStorage.getItem('locale') === undefined || window.sessionStorage.getItem('locale') === null) {
  initIntl('en-US');
  window.sessionStorage.setItem('locale', 'en-US');
} else {
  initIntl(window.sessionStorage.getItem('locale'));
}

emit.on('change_language', lang => initIntl(lang));

/** get session storage */
if (window.sessionStorage.getItem('locale') === undefined || window.sessionStorage.getItem('locale') === null) {
  initIntl('en-US');
  window.sessionStorage.setItem('locale', 'en-US');
} else {
  initIntl(window.sessionStorage.getItem('locale'));
}

emit.on('change_language', lang => initIntl(lang));

// 1. Initialize
const app = dva({
  history: createHistory(),
  onAction: middlewares,
});

// 2. Plugins
app.use(createLoading());

// 3. Register global model
app.model(require('./models/global').default);

// 4. Router
app.router(require('./router').default);

// 5. Start
app.start('#root');

export default app._store; // eslint-disable-line
