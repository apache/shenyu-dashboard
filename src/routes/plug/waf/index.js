import React, { Component } from 'react';
import { connect } from 'dva';

@connect(({ waf }) => ({
  waf,
}))

export default class Waf extends Component {
  componentDidMount() {
    
  }

  render() {
    return (
      <div>
        waf
      </div>
    );
  }
}