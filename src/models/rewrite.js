export default {
  namespace: 'rewrite',

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
