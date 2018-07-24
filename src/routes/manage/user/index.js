import React, { Component } from 'react';
import { connect } from 'dva';

@connect(({ manage }) => ({
  manage,
}))
export default class Manage extends Component {
  componentDidMount() {}

  render() {
    return <div>Manage</div>;
  }
}
