import { message } from 'antd';
import { getAllUsers, findUser, updateUser, deleteUser, addUser } from '../services/api';

export default {
  namespace: 'manage',

  state: {
    userList: [],
    total: 0,
  },

  effects: {
    *fetchUsers(params, { call, put }) {
      const { payload } = params;
      const json = yield call(getAllUsers, payload);
      if (json.code === 200) {
        let { page, dataList } = json.data;
        dataList = dataList.map((item) => {
          item.key = item.id;
          return item;
        })
        yield put({
          type: 'saveUsers',
          payload: {
            total: page.totalCount,
            dataList,
          },
        });
      }
    },
    *fetchItem(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(findUser, payload);
      if (json.code === 200) {
        const user = json.data;
        callback(user);
      }
    },
    *add(params, { call, put }) {
      const { payload, callback } = params;
      const json = yield call(addUser, payload);
      if (json.code === 200) {
        message.success('添加成功');
        callback();
        yield put({ type: 'reload', payload })
      }
    },
    *delete(params, { call, put }) {
      const { payload } = params;
      const { list } = payload;
      const json = yield call(deleteUser, {list});
      if (json.code === 200) {
        message.success('删除成功');
        yield put({ type: 'reload', payload })
      }

    },
    *update(params, { call, put }) {
      const { payload, callback } = params;
      const json = yield call(updateUser, payload);
      if (json.code === 200) {
        message.success('修改成功');
        callback();
        yield put({ type: 'reload', payload })
      }

    },
    *reload(params, { put }) {
      const { userName, currentPage, pageSize } = params;
      yield put({ type: 'fetchUsers', payload: { userName, currentPage, pageSize } });
    },
  },

  reducers: {
    saveUsers(state, { payload }) {
      return {
        ...state,
        userList: payload.dataList,
        total: payload.total,
      };
    },
  },
};
