/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
        <span>{getIntlContent("SHENYU.HOME.WELCOME")}</span>
      </div>
    );
  }
}
