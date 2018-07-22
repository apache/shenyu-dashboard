export default {
  namespace: 'waf',

  state: {
    list: [],
  },

  effects: {
    
  },

  reducers: {
    saveList(state, action) {
      return {
        ...state,
        list: action.payload,
      };
    },
  },
};
