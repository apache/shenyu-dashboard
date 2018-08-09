import request from '../utils/request';

/* 添加用户 */
export async function addUser(params) {
  return request('/dashboardUser', {
    method: 'POST',
    body: {
      ...params,
    },
  });
}
/* 删除用户 */
export async function deleteUser(params) {
  return request(`/dashboardUser/${params.id}`, {
    method: 'DELETE',
  });
}
/* 修改用户 */
export async function updateUser(params) {
  return request(`/dashboardUser/${params.id}`, {
    method: 'PUT',
    body: {
      ...params,
    },
  });
}
/* 查询所有用户 */
export async function getAllUsers(params) {
  return request('/dashboardUser', {
    method: 'GET',
    body: {
      ...params,
    },
  });
}
/* 查询单个用户 */
export async function findUser(params) {
  return request(`/dashboardUser/${params.id}`, {
    method: 'GET',
  });
}

// 插件管理
/* 增加插件 */
export async function addPlugin(params) {
  return request('/plugin', {
    method: 'POST',
    body: {
      ...params,
    },
  });
}
/* 删除插件 */
export async function deletePlugin(params) {
  return request(`/plugin/${params.id}`, {
    method: 'DELETE',
  });
}
/* 修改插件 */
export async function updatePlugin(params) {
  return request(`/plugin/${params.id}`, {
    method: 'PUT',
    body: {
      ...params,
    },
  });
}
/* 查询所有插件 */
export async function getAllPlugins(params) {
  return request('/plugin', {
    method: 'GET',
    body: {
      ...params,
    },
  });
}
/* 查询单个插件 */
export async function findPlugin(params) {
  return request(`/plugin/${params.id}`, {
    method: 'GET',
  });
}

// 选择器管理

/* 增加插件 */
export async function addSelector(params) {
  return request('/selector', {
    method: 'POST',
    body: {
      ...params,
    },
  });
}
/* 删除插件 */
export async function deleteSelector(params) {
  return request(`/selector/${params.id}`, {
    method: 'DELETE',
  });
}
/* 修改插件 */
export async function updateSelector(params) {
  return request(`/selector/${params.id}`, {
    method: 'PUT',
    body: {
      ...params,
    },
  });
}
/* 查询所有插件 */
export async function getAllSelectors(params) {
  return request('/selector', {
    method: 'GET',
    body: {
      ...params,
    },
  });
}
/* 查询单个插件 */
export async function findSelector(params) {
  return request(`/selector/${params.id}`, {
    method: 'GET',
  });
}

/* 查询所有常量 */
export async function queryPlatform() {
  return request(`/platform}`, {
    method: 'GET',
  });
}