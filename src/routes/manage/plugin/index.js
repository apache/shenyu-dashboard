import React, { Component } from 'react';
import { connect } from 'dva';

@connect(({ plugin }) => ({
  plugin,
}))
export default class Plugin extends Component {
  componentDidMount() {}

  render() {
    return <div>Manage</div>;
  }
}
