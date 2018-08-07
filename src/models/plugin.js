export default {
  namespace: 'plugin',

  state: {
    list: [],
  },

  effects: {},

  reducers: {
    saveList(state, action) {
      return {
        ...state,
        list: action.payload,
      };
    },
  },
};
