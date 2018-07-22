export default {
  namespace: 'divide',

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
