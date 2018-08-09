import { getAllPlugins } from '../services/api';

export default {
  namespace: 'plugin',

  state: {
    pluginList: [],
  },

  effects: {
    *fetchList(params, { call, put }) {
      const json = yield call(getAllPlugins, params);
      if (json.code === 200) {
        const dataList = json.data.dataList.map(item => {
          item.key = item.id;
          return item;
        });
        const total = json.data.page.totalCount;

        yield put({
          type: 'savePlugins',
          payload: {
            total,
            dataList,
          },
        });
      }


    },
  },

  reducers: {
    savePlugins(state, { payload }) {
      return {
        ...state,
        pluginList: payload.dataList,
      };
    },
  },
};
