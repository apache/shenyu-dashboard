import { getAllUsers } from '../services/api';

export default {
  namespace: 'plugin',

  state: {
    userList: [],
  },

  effects: {
    *fetchList(params, { call, put }) {
      let { page, dataList } = yield call(getAllUsers, params);
      dataList = dataList.map(item => {
        item.key = item.id;
        return item;
      });
      yield put({
        type: 'saveUsers',
        payload: {
          total: page.totalCount,
          dataList,
        },
      });
    },
  },

  reducers: {
    saveUsers(state, { payload }) {
      return {
        ...state,
        userList: payload.dataList,
      };
    },
  },
};
