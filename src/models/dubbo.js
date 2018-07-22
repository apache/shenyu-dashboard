export default {
  namespace: 'dubbo',

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
