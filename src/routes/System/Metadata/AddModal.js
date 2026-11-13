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
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import LocaleProvider from "@douyinfe/semi-ui/lib/es/locale/localeProvider";
import enUS from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import zhCN from "@douyinfe/semi-ui/lib/es/locale/source/zh_CN";
import "@douyinfe/semi-ui/lib/es/_base/base.css";
import { connect } from "dva";
import { getIntlContent } from "../../../utils/IntlUtils";

@connect(({ global }) => ({
  platform: global.platform,
  language: global.language,
}))
class AddModal extends Component {
  getFormApi = (formApi) => {
    this.formApi = formApi;
  };

  handleSubmit = (event) => {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    this.formApi.submitForm();
  };

  handleValidSubmit = (values) => {
    const { handleOk, id = "" } = this.props;
    handleOk({ ...values, id });
  };

  render() {
    const {
      handleCancel,
      platform,
      language,
      isShow,
      appName = "",
      serviceName = "",
      rpcType = "",
      methodName = "",
      rpcExt = "",
      path = "",
      pathDesc,
      parameterTypes = "",
      enabled = true,
    } = this.props;
    const locale =
      language || window.sessionStorage.getItem("locale") || "en-US";
    const initValues = {
      appName,
      serviceName,
      rpcType,
      methodName,
      rpcExt,
      path,
      pathDesc,
      parameterTypes,
      enabled,
    };

    return (
      <LocaleProvider locale={locale === "en-US" ? enUS : zhCN}>
        <Modal
          width={450}
          centered
          title={getIntlContent("SHENYU.META.DATA")}
          visible
          okText={getIntlContent("SHENYU.COMMON.SURE")}
          cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
          okButtonProps={{ "aria-label": getIntlContent("SHENYU.COMMON.SURE") }}
          cancelButtonProps={{
            "aria-label": getIntlContent("SHENYU.COMMON.CALCEL"),
          }}
          onOk={this.handleSubmit}
          onCancel={handleCancel}
        >
          <Form
            initValues={initValues}
            getFormApi={this.getFormApi}
            onSubmit={this.handleValidSubmit}
            allowEmpty
            autoScrollToError
            labelPosition="left"
            labelAlign="right"
            labelWidth={130}
          >
            <Form.Input
              field="appName"
              label={getIntlContent("SHENYU.AUTH.APPNAME")}
              rules={[
                {
                  required: true,
                  message:
                    getIntlContent("SHENYU.AUTH.INPUT") +
                    getIntlContent("SHENYU.AUTH.APPNAME"),
                },
              ]}
              placeholder={getIntlContent("SHENYU.AUTH.APPNAME")}
              showClear
            />
            <Form.Input
              field="methodName"
              label={getIntlContent("SHENYU.META.FUNC.NAME")}
              rules={[
                {
                  required: true,
                  message:
                    getIntlContent("SHENYU.AUTH.INPUT") +
                    getIntlContent("SHENYU.META.FUNC.NAME"),
                },
              ]}
              placeholder={getIntlContent("SHENYU.META.FUNC.NAME")}
              showClear
            />
            <Form.Input
              field="path"
              label={getIntlContent("SHENYU.META.PATH")}
              rules={[
                {
                  required: true,
                  message:
                    getIntlContent("SHENYU.AUTH.INPUT") +
                    getIntlContent("SHENYU.META.PATH"),
                },
              ]}
              placeholder={getIntlContent("SHENYU.META.PATH")}
              showClear
            />
            <Form.Input
              field="pathDesc"
              label={getIntlContent("SHENYU.AUTH.PATH.DESCRIBE")}
              placeholder={getIntlContent("SHENYU.AUTH.PATH.DESCRIBE")}
              showClear
            />
            <Form.Input
              field="parameterTypes"
              label={`${getIntlContent("SHENYU.AUTH.PARAMS")}${getIntlContent("SHENYU.COMMON.TYPE")}`}
              placeholder={`${getIntlContent("SHENYU.AUTH.PARAMS")}${getIntlContent("SHENYU.COMMON.TYPE")}`}
              showClear
            />
            <Form.TextArea
              field="rpcExt"
              label={`Rpc${getIntlContent("SHENYU.META.EXPAND.PARAMS")}`}
              placeholder={`Rpc${getIntlContent("SHENYU.META.EXPAND.PARAMS")}`}
              rows={3}
            />
            <Form.Input
              field="serviceName"
              label={getIntlContent("SHENYU.META.SERVER.INTER")}
              rules={[
                {
                  required: true,
                  message: getIntlContent("SHENYU.META.INPUTSERVICEINTERFACE"),
                },
              ]}
              placeholder={getIntlContent("SHENYU.META.SERVER.INTER")}
              showClear
            />
            <Form.Select
              field="rpcType"
              motion={false}
              label={`Rpc${getIntlContent("SHENYU.COMMON.TYPE")}`}
              rules={[
                {
                  required: true,
                  message: getIntlContent("SHENYU.META.SELECTRPCTYPE"),
                },
              ]}
              optionList={platform.rpcTypeEnums.map((item) => ({
                label: item.name,
                value: item.name,
              }))}
              style={{ width: "100%" }}
            />
            <Form.Switch
              field="enabled"
              label={getIntlContent("SHENYU.SYSTEM.STATUS")}
              disabled={!isShow}
            />
          </Form>
        </Modal>
      </LocaleProvider>
    );
  }
}

export default AddModal;
