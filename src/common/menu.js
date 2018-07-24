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
      },
      {
        name: 'rewrite',
        path: 'rewrite',
      },
      {
        name: 'rate_limiter',
        path: 'limiter',
      },
      {
        name: 'divide',
        path: 'divide',
      },
      {
        name: 'dubbo',
        path: 'dubbo',
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
