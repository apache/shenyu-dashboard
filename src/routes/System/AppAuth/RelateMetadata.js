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
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import LocaleProvider from "@douyinfe/semi-ui/lib/es/locale/localeProvider";
import enUS from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import zhCN from "@douyinfe/semi-ui/lib/es/locale/source/zh_CN";
import "@douyinfe/semi-ui/lib/es/_base/base.css";
import TableTransferComponent from "./TableTransfer";
import { getIntlContent } from "../../../utils/IntlUtils";

const grantSignature = (rows) =>
  rows
    .map((row) => JSON.stringify([row.path, row.appName]))
    .sort()
    .join("\n");

export default class RelateMetadata extends Component {
  static getDerivedStateFromProps(props, state) {
    if (props.id !== state.id) {
      return {
        id: props.id,
        authPathDTOList: [...props.auth],
        validationError: null,
      };
    }
    return null;
  }

  constructor(props) {
    super(props);
    this.state = {
      id: props.id,
      authPathDTOList: [...props.auth],
      validationError: null,
    };
  }

  getUpdateMetas = (authPathDTOList) => {
    this.setState({ authPathDTOList, validationError: null });
  };

  handleSubmit = () => {
    const { authPathDTOList } = this.state;
    if (!authPathDTOList.length) {
      this.setState({ validationError: "SHENYU.AUTH.RESOURCE.REQUIRED" });
      return;
    }
    if (grantSignature(authPathDTOList) === grantSignature(this.props.auth)) {
      this.props.handleCancel();
      return;
    }
    const selected = new Set(authPathDTOList.map((row) => row.path));
    if (
      this.props.auth.some(
        (row) => row.enabled === false && selected.has(row.path),
      )
    ) {
      this.setState({
        validationError: "SHENYU.AUTH.RESOURCE.DISABLED.REPLACEMENT",
      });
      return;
    }
    this.props.handleOk({
      id: this.props.id,
      authPathDTOList: authPathDTOList.map((row) => ({ ...row })),
    });
  };

  render() {
    const { id, authName, handleCancel, auth, dataList, language } = this.props;
    const { authPathDTOList, validationError } = this.state;
    const locale =
      language || window.sessionStorage.getItem("locale") || "en-US";
    return (
      <LocaleProvider locale={locale.toLowerCase() === "en-us" ? enUS : zhCN}>
        <Modal
          width={1200}
          style={{ maxWidth: "calc(100vw - 32px)", minWidth: 0 }}
          centered
          visible
          title={getIntlContent("SHENYU.AUTH.EDITOR.RESOURCE")}
          okText={getIntlContent("SHENYU.COMMON.SURE")}
          cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
          okButtonProps={{ "aria-label": getIntlContent("SHENYU.COMMON.SURE") }}
          cancelButtonProps={{
            "aria-label": getIntlContent("SHENYU.COMMON.CALCEL"),
          }}
          bodyStyle={{ maxHeight: "calc(100vh - 220px)", overflow: "auto" }}
          onOk={this.handleSubmit}
          onCancel={handleCancel}
        >
          <TableTransferComponent
            key={id}
            authName={authName}
            auth={auth}
            datalist={dataList}
            targetKeys={authPathDTOList.map((row) => row.path)}
            handleGetUpdateMetas={this.getUpdateMetas}
          />
          {validationError && (
            <p role="alert" style={{ color: "var(--semi-color-danger)" }}>
              {getIntlContent(validationError)}
            </p>
          )}
        </Modal>
      </LocaleProvider>
    );
  }
}
