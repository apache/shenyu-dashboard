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
import { Modal } from "antd";
import { connect } from "dva";
import { getIntlContent } from "../../../utils/IntlUtils";

@connect(({ discovery }) => ({
  discovery,
}))
class DiscoveryImportModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      configList: {},
      loading: false,
    };
  }

  componentDidMount() {
    const { dispatch, pluginName } = this.props;
    dispatch({
      type: "discovery/fetchDiscovery",
      payload: {
        pluginName,
        level: "1",
      },
      callback: (discoveryConfigList) => {
        this.setState({ configList: discoveryConfigList });
      },
    });
  }

  handleCancel = () => {
    const { onCancel } = this.props;
    // eslint-disable-next-line no-unused-expressions
    onCancel && onCancel();
  };

  handleOk = async () => {
    const { onOk } = this.props;
    const { configList } = this.state;
    // eslint-disable-next-line no-unused-expressions
    onOk && onOk(configList);
  };

  render() {
    const { visible = false } = this.props;
    const { loading, configList } = this.state;
    const {
      type = "",
      serverList = "",
      props: discoveryProps = "{}",
    } = configList || {};
    return (
      <Modal
        visible={visible}
        centered
        title={getIntlContent(
          "SHENYU.DISCOVERY.SELECTOR.CONFIG.IMPORT.CONFIRM",
        )}
        onCancel={this.handleCancel}
        onOk={this.handleOk}
        confirmLoading={loading}
        okText={getIntlContent("SHENYU.DISCOVERY.SELECTOR.CONFIG.IMPORT.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
      >
        <ul>
          <li style={{ marginBottom: "8px" }}>
            <strong>
              {getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.TYPE")}:
            </strong>{" "}
            {type}
          </li>
          <li style={{ marginBottom: "8px" }}>
            <strong>
              {getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.SERVERLIST")}:
            </strong>{" "}
            {serverList}
          </li>
          <li>
            <strong>
              {getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.PROPS")}:
            </strong>{" "}
            <pre>
              <code>{JSON.stringify(JSON.parse(discoveryProps), null, 4)}</code>
            </pre>
          </li>
        </ul>
      </Modal>
    );
  }
}

export default DiscoveryImportModal;
