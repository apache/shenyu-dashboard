import mockjs from 'mockjs';
import { getRule, postRule } from './mock/rule';
import { getActivities, getNotice, getFakeList } from './mock/api';
import { getFakeChartData } from './mock/chart';
import { getProfileBasicData } from './mock/profile';
import { getProfileAdvancedData } from './mock/profile';
import { getNotices } from './mock/notices';

import { getUsers } from './mock/user';
import { getPlatform } from './mock/platform'
import { getPlugin } from './mock/plugin'
import { format, delay } from 'roadhog-api-doc';

// 是否禁用代理
const noProxy = process.env.NO_PROXY === 'true';

// 代码中会兼容本地 service mock 以及部署站点的静态数据
const proxy = {
  'GET /dashboardUser': {
    $params: {
      userName: 'ADMIN',
      currentPage: 1,
      pageSize: 10,
    },
    $body: getUsers(),
  },

  'GET /dashboardUser/1': {
    "code": 200,
    "message": "detail dashboard user success",
    "data": {
      "id": "1",
      "userName": "admin",
      "password": "123456",
      "role": 1,
      "enabled": false,
      "dateCreated": "2018-06-23 15:12:22",
      "dateUpdated": "2018-06-23 15:12:23"
    }
  },
  'POST /dashboardUser': {
    $body: {
      code: 200
    },
  },
  'PUT /dashboardUser/1': {
    $body: {
      code: 200
    },
  },
  'POST /dashboardUser/delete': {
    $body: {
      code: 200
    },
  },
  
  'GET /plugin': {
    $body: getPlugin,
  },

  'GET /plugin/1': {
    "code": 200,
    "message": "detail dashboard user success",
    "data": {
      "id": "1",
      "name": "admin",
      "enabled": false,
    }
  },
  'POST /plugin': {
    $body: {
      code: 200
    },
  },
  'PUT /plugin/1': {
    $body: {
      code: 200
    },
  },
  'POST /plugin/delete': {
    $body: {
      code: 200
    },
  },

  
  'POST /api/forms': (req, res) => {
    res.send({ message: 'Ok' });
  },
  'GET /api/tags': mockjs.mock({
    'list|100': [{ name: '@city', 'value|1-100': 150, 'type|0-2': 1 }],
  }),
  'GET /api/fake_list': getFakeList,
  'GET /api/fake_chart_data': getFakeChartData,
  'GET /api/profile/basic': getProfileBasicData,
  'GET /api/profile/advanced': getProfileAdvancedData,
  'POST /api/login/account': (req, res) => {
    const { password, userName, type } = req.body;
    if (password === '888888' && userName === 'admin') {
      res.send({
        status: 'ok',
        type,
        currentAuthority: 'admin',
      });
      return;
    }
    if (password === '123456' && userName === 'user') {
      res.send({
        status: 'ok',
        type,
        currentAuthority: 'user',
      });
      return;
    }
    res.send({
      status: 'error',
      type,
      currentAuthority: 'guest',
    });
  },
  'POST /api/register': (req, res) => {
    res.send({ status: 'ok', currentAuthority: 'user' });
  },
  'GET /api/notices': getNotices,
  'GET /api/500': (req, res) => {
    res.status(500).send({
      timestamp: 1513932555104,
      status: 500,
      error: 'error',
      message: 'error',
      path: '/base/category/list',
    });
  },
  'GET /api/404': (req, res) => {
    res.status(404).send({
      timestamp: 1513932643431,
      status: 404,
      error: 'Not Found',
      message: 'No message available',
      path: '/base/category/list/2121212',
    });
  },
  'GET /api/403': (req, res) => {
    res.status(403).send({
      timestamp: 1513932555104,
      status: 403,
      error: 'Unauthorized',
      message: 'Unauthorized',
      path: '/base/category/list',
    });
  },
  'GET /api/401': (req, res) => {
    res.status(401).send({
      timestamp: 1513932555104,
      status: 401,
      error: 'Unauthorized',
      message: 'Unauthorized',
      path: '/base/category/list',
    });
  },
};

export default (noProxy ? {} : delay(proxy, 1000));
