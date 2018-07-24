export default {
  namespace: 'manage',

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
