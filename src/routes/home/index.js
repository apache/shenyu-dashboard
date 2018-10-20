import React, { Component } from "react";
import { connect } from "dva";
import styles from "./home.less";

@connect(({ global }) => ({
  global
}))
export default class Home extends Component {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: "global/fetchPlatform"
    });
  }

  render() {
    return (
      <div className={styles.content}>
        <span>欢迎登录soul网关管理系统</span>
      </div>
    );
  }
}
