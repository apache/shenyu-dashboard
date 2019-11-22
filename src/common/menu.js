import { isUrl } from '../utils/utils';


const menuData = [
  {
    name: '插件列表',
    icon: 'dashboard',
    path: 'plug',
    children: [
      {
        name: 'waf',
        path: 'waf',
        id: 'waf1'
      },
      {
        name: 'sign',
        path: 'sign',
        id: 'sign2'
      },
      {
        name: 'monitor',
        path: 'monitor',
        id: 'monitor3'
      },
      {
        name: 'rewrite',
        path: 'rewrite',
        id: 'rewrite4'
      },
      {
        name: 'rate_limiter',
        path: 'rate_limiter',
        id: 'rate_limiter5'
      },
      {
        name: 'divide',
        path: 'divide',
        id: 'divide6'
      },
      {
        name: 'dubbo',
        path: 'dubbo',
        id: 'dubbo7'
      },
      {
        name: 'springCloud',
        path: 'springCloud',
        id: 'springCloud8'
      },
    ],
  },
  {
    name: '系统管理',
    icon: 'setting',
    path: 'system',
    children: [
      {
        name: '用户管理',
        path: 'manage',
      },
      {
        name: '插件管理',
        path: 'plugin',
      },
      {
        name: '认证管理',
        path: 'auth'
      },
      {
        name: '元数据管理',
        path: 'metadata'
      }

    ],
  },
];

function formatter(data, parentPath = '/', parentAuthority) {
  return data.map(item => {
    let { path } = item;
    if (!isUrl(path)) {
      path = parentPath + item.path;
    }
    const result = {
      ...item,
      path,
      authority: item.authority || parentAuthority,
    };
    if (item.children) {
      result.children = formatter(item.children, `${parentPath}${item.path}/`, item.authority);
    }
    return result;
  });
}

export const getMenuData = () => formatter(menuData);
