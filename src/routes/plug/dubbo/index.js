import React, { Component } from 'react';
import { connect } from 'dva';

@connect(({ dubbo }) => ({
  dubbo,
}))

export default class Dubbo extends Component {
  componentDidMount() {
    
  }

  render() {
    return (
      <div>
        Dubbo
      </div>
    );
  }
}