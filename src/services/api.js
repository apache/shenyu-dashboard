import { stringify } from "qs";
import request from "../utils/request";

const baseUrl = document.getElementById("httpPath").innerHTML;
/* add user */
export async function addUser(params) {
  return request(`${baseUrl}/dashboardUser`, {
    method: `POST`,
    body: {
      ...params,
      role: 1
    }
  });
}
/* delete user */
export async function deleteUser(params) {
  return request(`${baseUrl}/dashboardUser/batch`, {
    method: `DELETE`,
    body: [...params.list]
  });
}
/* update user */
export async function updateUser(params) {
  return request(`${baseUrl}/dashboardUser/${params.id}`, {
    method: `PUT`,
    body: {
      userName: params.userName,
      password: params.password,
      roles: params.roles,
      enabled: params.enabled,
      role: 1
    }
  });
}
/* get all metadata */
export async function getAllMetadata(params) {
  const { appName, currentPage, pageSize } = params;
  let myParams = params;
  if (appName) {
    myParams = params;
  } else {
    myParams = { currentPage, pageSize };
  }

  return request(`${baseUrl}/meta-data/queryList?${stringify(myParams)}`, {
    method: `GET`
  });
}

export async function findMetadata(params) {
  // const { appName, currentPage, pageSize } = params;
  // let myParams = params;
  // if (appName) {
  //   myParams = params;
  // } else {
  //   myParams = { currentPage, pageSize };
  // }
  return request(`${baseUrl}/meta-data/${params.id}`, {
    method: `GET`
  });
}
/* addMetadata */
export async function addMetadata(params) {
  return request(`${baseUrl}/meta-data/createOrUpdate`, {
    method: `POST`,
    body: {
      ...params
    }
  });
}
/* updateMetadata */
export async function updateMetadata(params) {
  return request(`${baseUrl}/meta-data/createOrUpdate`, {
    method: `POST`,
    body: {
      appName: params.appName,
      enabled: params.enabled,
      id: params.id,
      pathDesc:params.pathDesc,
      methodName: params.methodName,
      parameterTypes:params.parameterTypes,
      path: params.path,
      rpcExt: params.rpcExt,
      rpcType: params.rpcType,
      serviceName: params.serviceName
    }
  });
}
/* syncData */
export async function syncData() {
  return request(`${baseUrl}/meta-data/syncData`, {
    method: `POST`,
    body: {

    }
  });
}

/* getfetchMetaGroup */
export async function getfetchMetaGroup() {
  return request(`${baseUrl}/meta-data/findAllGroup`,{
    method: `GET`
  })
}

/* deleteMetadata */
export async function deleteMetadata(params) {
  return request(`${baseUrl}/meta-data/batchDeleted`, {
    method: `POST`,
    body: [...params.list]
  });
}
/* updateEnabled */
export async function updateEnabled(params) {

  return request(`${baseUrl}/meta-data/batchEnabled`, {
    method: `POST`,
    body: {
      ids: params.list,
      enabled: params.enabled
    }
  });
}
/* getAllUsers */
export async function getAllUsers(params) {
  const { userName, currentPage, pageSize } = params;
  let myParams = params;
  if (userName) {
    myParams = params;
  } else {
    myParams = { currentPage, pageSize };
  }
  return request(`${baseUrl}/dashboardUser?${stringify(myParams)}`, {
    method: `GET`
  });
}
/* findUser */
export async function findUser(params) {
  return request(`${baseUrl}/dashboardUser/${params.id}`, {
    method: `GET`
  });
}

/* addPlugin */
export async function addPlugin(params) {
  return request(`${baseUrl}/plugin`, {
    method: `POST`,
    body: {
      ...params
    }
  });
}
/* deletePlugin */
export async function deletePlugin(params) {
  return request(`${baseUrl}/plugin/batch`, {
    method: `DELETE`,
    body: [...params.list]
  });
}
/* updatePlugin */
export async function updatePlugin(params) {
  return request(`${baseUrl}/plugin/${params.id}`, {
    method: `PUT`,
    body: {
      ids: [params.id],
      name: params.name,
      role: params.role,
      config: params.config,
      enabled: params.enabled
    }
  });
}

/* getAllPlugins */
export async function getAllPlugins(params) {
  const { name, currentPage, pageSize } = params;
  let myParams = params;
  if (name) {
    myParams = params;
  } else {
    myParams = { currentPage, pageSize };
  }
  return request(`${baseUrl}/plugin?${stringify(myParams)}`, {
    method: `GET`
  });
}
/* findPlugin */
export async function findPlugin(params) {
  return request(`${baseUrl}/plugin/${params.id}`, {
    method: `GET`
  });
}
/* updatepluginEnabled */
export async function updatepluginEnabled(params) {
  return request(`${baseUrl}/plugin/enabled`, {
    method: `POST`,
    body: {
      ids: params.list,
      enabled: params.enabled
    }
  })
}

/* addAuth */
export async function addAuth(params) {
  return request(`${baseUrl}/appAuth`, {
    method: `POST`,
    body: {
      ...params
    }
  });
}
/* deleteAuth */
export async function deleteAuth(params) {
  return request(`${baseUrl}/appAuth/batch`, {
    method: `DELETE`,
    body: [...params.list]
  });
}
/* updateAuth */
export async function updateAuth(params) {
  return request(`${baseUrl}/appAuth/${params.id}`, {
    method: `PUT`,
    body: {
      appKey: params.appKey,
      appSecret: params.appSecret,
      enabled: params.enabled
    }
  });
}
/* getAllAuth */
export async function getAllAuth(params) {
  const { appKey, currentPage, pageSize } = params;
  let myParams = params;
  if (appKey) {
    myParams = params;
  } else {
    myParams = { currentPage, pageSize };
  }
  return request(`${baseUrl}/appAuth?${stringify(myParams)}`, {
    method: `GET`
  });
}
/* syncAuthsData */
export async function syncAuthsData() {
  return request(`${baseUrl}/appAuth/syncData`, {
    method: `POST`,
    body: {}
  })
}
/* getAllAuths */
export async function getAllAuths(params) {
  const { appKey,phone, currentPage, pageSize } = params;
  let myParams = params;
  if (appKey || phone) {
    myParams = params;
  } else {
    myParams = { currentPage, pageSize };
  }
  return request(`${baseUrl}/appAuth/findPageByQuery?${stringify(myParams)}`, {
    method: `GET`
  });
}

/* findAuthData */
export async function findAuthData(params) {
  return request(`${baseUrl}/appAuth/detail?id=${params.id}`, {
    method: `GET`
  });
}
/* findAuthDataDel */
export async function findAuthDataDel(params) {
  return request(`${baseUrl}/appAuth/detailPath?id=${params.id}`, {
    method: `GET`
  });
}
/* get all metadatas */
export async function getAllMetadatas() {
  return request(`${baseUrl}/meta-data/findAll`,{
    method: `GET`
  })
}
/* update auth */
export async function updateAuthData(params) {

  return request(`${baseUrl}/appAuth/updateDetail`, {
    method: `POST`,
    body: {
      ...params
    }
  })
}
/* update authDel */
export async function updateAuthDel(params) {
  return request(`${baseUrl}/appAuth/updateDetailPath`, {
    method: `POST`,
    body: params
  })
}
/* add auth */
export async function addAuthData(params) {
    return request(`${baseUrl}/appAuth/apply`, {
      method: `POST`,
      body: {
        ...params
      }
    })
}
/* batch enable auth */
export async function updateAuthEnabled(params) {
  return request(`${baseUrl}/appAuth/batchEnabled`, {
    method: `POST`,
    body: {
      ids: params.list,
      enabled: params.enabled
    }
  })
}
/* batch delete auth */
export async function deleteAuths(params) {
  return request(`${baseUrl}/appAuth/batchDelete`,{
    method: `POST`,
    body: [...params.list]
  })
}
/* find auth */
export async function findAuth(params) {
  return request(`${baseUrl}/appAuth/${params.id}`, {
    method: `GET`
  });
}

/* add selector */
export async function addSelector(params) {
  return request(`${baseUrl}/selector`, {
    method: `POST`,
    body: {
      ...params
    }
  });
}
/* delete selector */
export async function deleteSelector(params) {
  return request(`${baseUrl}/selector/batch`, {
    method: `DELETE`,
    body: [...params.list]
  });
}
/* update selector */
export async function updateSelector(params) {
  return request(`${baseUrl}/selector/${params.id}`, {
    method: `PUT`,
    body: {
      ...params
    }
  });
}
/* get all selectors */
export async function getAllSelectors(params) {
  return request(`${baseUrl}/selector?${stringify(params)}`, {
    method: `GET`
  });
}
/* get single selector */
export async function findSelector(params) {
  return request(`${baseUrl}/selector/${params.id}`, {
    method: `GET`
  });
}

export async function getAllRules(params) {
  return request(`${baseUrl}/rule?${stringify(params)}`, {
    method: `GET`
  });
}

export async function addRule(params) {
  return request(`${baseUrl}/rule`, {
    method: `POST`,
    body: {
      ...params
    }
  });
}
export async function deleteRule(params) {
  return request(`${baseUrl}/rule/batch`, {
    method: `DELETE`,
    body: [...params.list]
  });
}

export async function findRule(params) {
  return request(`${baseUrl}/rule/${params.id}`, {
    method: `GET`
  });
}

export async function updateRule(params) {
  return request(`${baseUrl}/rule/${params.id}`, {
    method: `PUT`,
    body: {
      ...params
    }
  });
}

/* query constants */
export async function queryPlatform() {
  return request(`${baseUrl}/platform/enum`, {
    method: `GET`
  });
}

/* login */
export async function queryLogin(params) {
  return request(`${baseUrl}/platform/login?${stringify(params)}`, {
    method: `GET`
  });
}

// sync all plugin
export async function asyncPlugin() {
  return request(`${baseUrl}/plugin/syncPluginAll`, {
    method: `POST`
  });
}
// 同步单个插件
export async function asyncOnePlugin(params) {
  return request(`${baseUrl}/plugin/syncPluginData/${params.id}`, {
    method: `PUT`
  });
}

// get plugin dropdown list
export async function getPluginDropDownList() {
  return request(`${baseUrl}/plugin/all`, {
    method: `GET`
  });
}

// get plugin handle list
export async function getAllPluginHandles(params) {
  const { pluginId, currentPage, pageSize } = params;
  let myParams = params;
  if (pluginId) {
    myParams = params;
  } else {
    myParams = { currentPage, pageSize };
  }
  return request(`${baseUrl}/plugin-handle?${stringify(myParams)}`, {
    method: `GET`
  });
}
// add plugin handle
export async function addPluginHandle(params) {
  return request(`${baseUrl}/plugin-handle`,{
    method: `POST`,
    body: {
      ...params
    }
  });
}
// get detail of plugin handle
export async function findPluginHandle(params) {
  return request(`${baseUrl}/plugin-handle/${params.id}`,{
    method: 'GET'
  })
}

// update PluginHandle
export async function updatePluginHandle(params) {
  return request(`${baseUrl}/plugin-handle/${params.id}`,{
    method: `PUT`,
    body: {
      ...params
    }
  })
}

// batchDeletePluginHandle
export async function batchDeletePluginHandle(params) {
  return request(`${baseUrl}/plugin-handle/batch`,{
    method: `DELETE`,
    body: [...params.list]
  });
}

export function fetchPluginHandleByPluginId(params) {
  return request(`${baseUrl}/plugin-handle/all/${params.pluginId}/${params.type}`,{
    method: `GET`
  });
}

// fetch dict list
export async function fetchSoulDicts(params) {
  return request(`${baseUrl}/soul-dict?${stringify(params)}`,{
    method: `GET`
  });
}

// add dict
export async function addSoulDict(params) {
  return request(`${baseUrl}/soul-dict`,{
    method: `POST`,
    body: {
      ...params
    }
  });
}

// get dict detail
export async function findSoulDict(params) {
  return request(`${baseUrl}/soul-dict/${params.id}`,{
    method: 'GET'
  })
}

// update dict
export async function updateSoulDict(params) {
  return request(`${baseUrl}/soul-dict/${params.id}`,{
    method: `PUT`,
    body: {
      ...params
    }
  })
}

// batch delete dicts
export async function batchDeleteSoulDict(params) {
  return request(`${baseUrl}/soul-dict/batch`,{
    method: `DELETE`,
    body: [...params.list]
  });
}

export function fetchSoulDictByType(params) {
  return request(`${baseUrl}/soul-dict/all/${params.type}`,{
    method: `GET`
  });
}

export async function updateSoulDictEnabled(params) {
  return request(`${baseUrl}/soul-dict/batchEnabled`, {
    method: `POST`,
    body: {
      ids: params.list,
      enabled: params.enabled
    }
  })
}

/* get all roles */
export async function getAllRoles() {
  return request(`${baseUrl}/role/getAllRoles`, {
    method: `GET`
  });
}

/* get roles by page */
export async function getRoleList(params) {
  const { roleName, currentPage, pageSize } = params;
  let myParams = { ...params };
  if (!roleName) {
    myParams = { currentPage, pageSize };
  }
  return request(`${baseUrl}/role?${stringify(myParams)}`, {
    method: `GET`
  });
}

/* find role */
export async function findRole(params) {
  return request(`${baseUrl}/role/${params.id}`, {
    method: `GET`
  });
}

/* add role */
export async function addRole(params) {
  return request(`${baseUrl}/role`, {
    method: `POST`,
    body: {
      ...params
    }
  });
}

/* delete role */
export async function deleteRole(params) {
  return request(`${baseUrl}/role/batch`, {
    method: `DELETE`,
    body: [...params.list]
  });
}

/* update role */
export async function updateRole(params) {
  return request(`${baseUrl}/role/${params.id}`, {
    method: `PUT`,
    body: {
      roleName: params.roleName,
      description: params.description,
      currentPermissionIds: params.currentPermissionIds
    }
  });
}

/* get resources by page */
export async function getAllResources(params) {
  const { title, currentPage, pageSize } = params;
  let myParams = { ...params };
  if (!title) {
    myParams = { currentPage, pageSize };
  }
  return request(`${baseUrl}/resource?${stringify(myParams)}`, {
    method: `GET`
  });
}

/* find resource */
export async function findResource(params) {
  return request(`${baseUrl}/resource/${params.id}`, {
    method: `GET`
  });
}

/* add resource */
export async function addResource(params) {
  return request(`${baseUrl}/resource`, {
    method: `POST`,
    body: {
      ...params
    }
  });
}

/* delete resource */
export async function deleteResource(params) {
  return request(`${baseUrl}/resource/batch`, {
    method: `DELETE`,
    body: [...params.list]
  });
}

/* update resource */
export async function updateResource(params) {
  return request(`${baseUrl}/resource/${params.id}`, {
    method: `PUT`,
    body: {
      ...params
    }
  });
}

/* get buttons by menuId */
export async function getButtons(params) {
  return request(`${baseUrl}/resource/button?id=${params.id}`, {
    method: `GET`
  });
}

/* get menu tree */
export async function getMenuTree() {
  return request(`${baseUrl}/resource/menu`, {
    method: `GET`
  });
}

// get userPermission by token
export async function getUserPermissionByToken(params) {
  return request(`${baseUrl}/permission/getUserPermissionByToken?token=${params.token}`, {
    method: `GET`
  });
}