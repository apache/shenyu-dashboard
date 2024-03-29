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
import { Modal, Form, Tooltip } from "antd";
import { connect } from "dva";
import { getIntlContent } from "../../utils/IntlUtils";

const keyMap = {
  metaImportSuccessCount: "metaImportSuccessCount",
  metaImportFailMessage: "metaImportFailMessage",
  authImportSuccessCount: "authImportSuccessCount",
  authImportFailMessage: "authImportFailMessage",
  pluginImportSuccessCount: "pluginImportSuccessCount",
  pluginImportFailMessage: "pluginImportFailMessage",
  proxySelectorImportSuccessCount: "proxySelectorImportSuccessCount",
  proxySelectorImportFailMessage: "proxySelectorImportFailMessage",
  discoveryImportSuccessCount: "discoveryImportSuccessCount",
  discoveryImportFailMessage: "discoveryImportFailMessage",
  discoveryUpstreamImportSuccessCount: "discoveryUpstreamImportSuccessCount",
  discoveryUpstreamImportFailMessage: "discoveryUpstreamImportFailMessage",
  dictImportSuccessCount: "dictImportSuccessCount",
  dictImportFailMessage: "dictImportFailMessage",
};

@connect(({ global }) => ({
  platform: global.platform,
}))
class ImportResultModal extends Component {
  // eslint-disable-next-line react/no-unused-class-component-methods
  handleSubmit = (e) => {
    const { form, handleOk } = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let { file } = values;
        handleOk({ file });
      }
    });
  };

  handleRes = (json, key) => {
    // return data;
    const data = json[key];
    const maxLength = 50; // set the max show length
    if (data && data.length > maxLength) {
      return (
        <Tooltip title={data}>{`${data.substring(0, maxLength)}...`}</Tooltip>
      );
    }
    return <Tooltip title={data}>{data}</Tooltip>;
  };

  formatKey = (key) => {
    return keyMap[key] || key;
  };

  renderContent = (json) => {
    return Object.keys(keyMap).map((key) => (
      <p key={key}>
        <strong>{this.formatKey(key)}:</strong> {this.handleRes(json, key)}
      </p>
    ));
  };

  render() {
    let { onOk, onCancel, json } = this.props;

    return (
      <Modal
        title={getIntlContent("SHENYU.COMMON.IMPORT.RESULT")}
        visible
        onOk={onOk}
        onCancel={onCancel}
      >
        <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
          {this.renderContent(json)}
        </pre>
      </Modal>
    );
  }
}

export default Form.create()(ImportResultModal);
