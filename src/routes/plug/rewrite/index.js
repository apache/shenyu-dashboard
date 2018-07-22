import React, { Component } from 'react';
import { connect } from 'dva';

@connect(({ rewriter }) => ({
  rewriter,
}))

export default class Rewriter extends Component {
  componentDidMount() {
    
  }

  render() {
    return (
      <div>
        rewriter
      </div>
    );
  }
}