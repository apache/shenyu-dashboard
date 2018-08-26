import { getAllSelectors, getAllRule } from '../services/api';

export default {
  namespace: 'waf',

  state: {
    selectList: [],
    ruleList: [],
    selectTotal: 0,
    ruleTotal: 0,
    currentSelector: '',
  },

  effects: {
    *fetchSelector(params, { call, put }) {
      const { payload } = params;
      const json = yield call(getAllSelectors, payload);
      if (json.code === 200) {
        let { page, dataList } = json.data;
        dataList = dataList.map((item) => {
          item.key = item.id;
          return item;
        })
        yield put({
          type: 'saveSelector',
          payload: {
            selectTotal: page.totalCount,
            dataList,
          },
        });
      }
    },
    *fetchRule(params, { call, put }){
      const { payload } = params;
      const json = yield call(getAllSelectors, payload);
      if (json.code === 200) {
        let { page, dataList } = json.data;
        dataList = dataList.map((item) => {
          item.key = item.id;
          return item;
        })
        yield put({
          type: 'saveRule',
          payload: {
            ruleTotal: page.totalCount,
            dataList,
          },
        });
      }
    }
  },

  reducers: {
    saveSelector(state, action) {
      return {
        ...state,
        list: action.payload,
      };
    },
  },
};
