import { message } from 'antd';
import { getAllPlugins, findPlugin, updatePlugin, deletePlugin, addPlugin } from '../services/api';

export default {
  namespace: 'plugin',

  state: {
    pluginList: [],
    total: 0,
  },

  effects: {
    *fetch(params, { call, put }) {
      const { payload } = params;
      const json = yield call(getAllPlugins, payload);
      if (json.code === 200) {
        let { page, dataList } = json.data;
        dataList = dataList.map((item) => {
          item.key = item.id;
          return item;
        })
        yield put({
          type: 'savePlugins',
          payload: {
            total: page.totalCount,
            dataList,
          },
        });
      }
    },
    *fetchItem(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(findPlugin, payload);
      if (json.code === 200) {
        const user = json.data;
        callback(user);
      }
    },
    *add(params, { call, put }) {
      const { payload, callback } = params;
      const json = yield call(addPlugin, payload);
      if (json.code === 200) {
        message.success('添加成功');
        callback();
        yield put({ type: 'reload', payload })
      }
    },
    *delete(params, { call, put }) {
      const { payload } = params;
      const { list } = payload;
      const json = yield call(deletePlugin, {list});
      if (json.code === 200) {
        message.success('删除成功');
        yield put({ type: 'reload', payload })
      }

    },
    *update(params, { call, put }) {
      const { payload, callback } = params;
      const json = yield call(updatePlugin, payload);
      if (json.code === 200) {
        message.success('修改成功');
        callback();
        yield put({ type: 'reload', payload })
      }

    },
    *reload(params, { put }) {
      const { name, currentPage, pageSize } = params;
      yield put({ type: 'fetch', payload: { name, currentPage, pageSize } });
    },
  },

  reducers: {
    savePlugins(state, { payload }) {
      return {
        ...state,
        pluginList: payload.dataList,
        total: payload.total,
      };
    },
  },
};
