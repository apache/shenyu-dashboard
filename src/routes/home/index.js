import React, { Component } from 'react';
import {connect } from 'dva';
import './home.less';

@connect(({ global }) => ({
  global,
}))
export default class Home extends Component {
  componentDidMount(){
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchPlatform',
    });
  }

  render() {
    return <div className="content">网关管理系统</div>;
  }
}
