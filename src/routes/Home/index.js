import React, { Component } from "react";
import { connect } from "dva";
import styles from "./home.less";
import { getCurrentLocale, getIntlContent } from '../../utils/IntlUtils'

@connect(({ global }) => ({
  global
}))
export default class Home extends Component {

  constructor(props) {
    super(props);
    this.state = {
      localeName: ''
    }
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: "global/fetchPlatform"
    });
  }

  changeLocales(locale) {
    this.setState({
      localeName: locale
    });
    getCurrentLocale(this.state.localeName);

  }

  render() {
    return (
      <div className={styles.content}>
        <span>{getIntlContent("SOUL.HOME.WELCOME")}</span>
      </div>
    );
  }
}
