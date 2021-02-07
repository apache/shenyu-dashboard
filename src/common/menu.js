import { isUrl } from '../utils/utils';
import { getIntlContent } from '../utils/IntlUtils'

export const menuData = [
  {
    name: getIntlContent('SOUL.MENU.PLUGIN.LIST'),
    icon: 'dashboard',
    path: 'plug',
    locale: 'SOUL.MENU.PLUGIN.LIST',
    children: [
      {
        name: 'divide',
        path: 'divide',
        id: 'divide6',
        locale: 'SOUL.MENU.PLUGIN.DIVIDE'
      },
      {
        name: 'hystrix',
        path: 'hystrix',
        id: 'hystrix9',
        locale: 'SOUL.MENU.PLUGIN.HYSTRIX'
      }
    ],
  },
  {
    name: getIntlContent('SOUL.MENU.SYSTEM.MANAGMENT'),
    icon: 'setting',
    path: 'system',
    locale: 'SOUL.MENU.SYSTEM.MANAGMENT',
    children: [
      {
        name: getIntlContent('SOUL.MENU.SYSTEM.MANAGMENT.ROLE'),
        path: 'role',
        locale: 'SOUL.MENU.SYSTEM.MANAGMENT.ROLE'
      },
      {
        name: getIntlContent('SOUL.MENU.SYSTEM.MANAGMENT.USER'),
        path: 'manage',
        locale: 'SOUL.MENU.SYSTEM.MANAGMENT.USER'
      },
      {
        name: getIntlContent('SOUL.MENU.SYSTEM.MANAGMENT.RESOURCE'),
        path: 'resource',
        locale: 'SOUL.MENU.SYSTEM.MANAGMENT.RESOURCE'
      }
    ],
  },
  {
    name: getIntlContent('SOUL.MENU.CONFIG.MANAGMENT'),
    icon: 'setting',
    path: 'config',
    locale: 'SOUL.MENU.CONFIG.MANAGMENT',
    children: [
      {
        name: getIntlContent('SOUL.MENU.SYSTEM.MANAGMENT.PLUGIN'),
        path: 'plugin',
        locale: 'SOUL.MENU.SYSTEM.MANAGMENT.PLUGIN'
      },
      {
        name: getIntlContent('SOUL.PLUGIN.PLUGINHANDLE'),
        path: 'pluginhandle',
        locale: 'SOUL.PLUGIN.PLUGINHANDLE'
      },
      {
        name: getIntlContent('SOUL.MENU.SYSTEM.MANAGMENT.AUTHEN'),
        path: 'auth',
        locale: 'SOUL.MENU.SYSTEM.MANAGMENT.AUTHEN'
      },
      {
        name: getIntlContent('SOUL.MENU.SYSTEM.MANAGMENT.METADATA'),
        path: 'metadata',
        locale: 'SOUL.MENU.SYSTEM.MANAGMENT.METADATA'
      },
      {
        name: getIntlContent('SOUL.MENU.SYSTEM.MANAGMENT.DICTIONARY'),
        path: 'dict',
        locale: 'SOUL.MENU.SYSTEM.MANAGMENT.DICTIONARY'
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
