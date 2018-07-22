import React, { Component } from 'react';
import { connect } from 'dva';

@connect(({ limiter }) => ({
  limiter,
}))

export default class Limiter extends Component {
  componentDidMount() {
    
  }

  render() {
    return (
      <div>
        limiter
      </div>
    );
  }
}