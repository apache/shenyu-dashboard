import React, { Component } from 'react';
import { connect } from 'dva';

@connect(({ divide }) => ({
  divide,
}))

export default class Divide extends Component {
  componentDidMount() {
    
  }

  render() {
    return (
      <div>
        divide
      </div>
    );
  }
}