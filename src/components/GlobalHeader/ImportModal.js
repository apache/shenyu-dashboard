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

import React, { Component, forwardRef } from "react";
import { Modal, Form, Button, Dropdown, Menu, Icon } from "antd";
import { connect } from "dva";
import { getIntlContent } from "../../utils/IntlUtils";
import { defaultNamespaceId } from "../_utils/utils";

const FormItem = Form.Item;
const ChooseFile = forwardRef(({ onChange, file }, ref) => {
  const handleFileInput = (e) => {
    onChange(e.target.files[0]);
  };
  return (
    <>
      <Button
        onClick={() => {
          document.getElementById("file").click();
        }}
      >
        {getIntlContent("SHENYU.COMMON.UPLOAD")}
      </Button>{" "}
      {file?.name}
      <input
        ref={ref}
        type="file"
        onChange={handleFileInput}
        style={{ display: "none" }}
        id="file"
      />
    </>
  );
});

const NamespaceSelector = forwardRef(
  // eslint-disable-next-line no-unused-vars
  ({ onChange, currentNamespaceId, namespaces }, ref) => {
    const handleNamespaceChange = (value) => {
      onChange(value.key);
    };
    return (
      <Dropdown
        overlay={
          <Menu onClick={handleNamespaceChange}>
            {namespaces.map((namespace) => {
              let isCurrentNamespace =
                currentNamespaceId === namespace.namespaceId;
              return (
                <Menu.Item
                  key={namespace.namespaceId}
                  disabled={isCurrentNamespace}
                >
                  <span>{namespace.name}</span>
                </Menu.Item>
              );
            })}
          </Menu>
        }
      >
        <Button>
          <a
            className="ant-dropdown-link"
            style={{ fontWeight: "bold" }}
            onClick={(e) => e.preventDefault()}
          >
            {`${getIntlContent("SHENYU.SYSTEM.NAMESPACE")} / ${
              namespaces.find(
                (namespace) => currentNamespaceId === namespace.namespaceId,
              )?.name
            } `}
          </a>
          <Icon type="down" />
        </Button>
      </Dropdown>
    );
  },
);

@connect(({ global }) => ({
  platform: global.platform,
  namespaces: global.namespaces,
}))
class ImportModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentNamespaceId: defaultNamespaceId,
    };
  }

  handleSubmit = (e) => {
    const { form, handleOk } = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let { namespace, file } = values;
        handleOk({ namespace, file });
      }
    });
  };

  handleNamespacesValueChange = (value) => {
    this.setState({ currentNamespaceId: value });
  };

  render() {
    let { handleCancel, form, config, file, namespaces } = this.props;
    let { currentNamespaceId } = this.state;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 7 },
      },
      wrapperCol: {
        sm: { span: 17 },
      },
    };
    if (config) {
      config = JSON.parse(config);
    }

    return (
      <Modal
        width={520}
        centered
        title={getIntlContent("SHENYU.COMMON.IMPORT")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            {...formItemLayout}
            label={getIntlContent("SHENYU.SYSTEM.NAMESPACE")}
          >
            {getFieldDecorator("namespace", {
              rules: [
                {
                  required: true,
                },
              ],
              initialValue: currentNamespaceId,
              valuePropName: "namespace",
            })(
              <NamespaceSelector
                onChange={this.handleNamespacesValueChange}
                currentNamespaceId={currentNamespaceId}
                namespaces={namespaces}
              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={getIntlContent("SHENYU.COMMON.IMPORT")}
          >
            {getFieldDecorator("file", {
              rules: [
                {
                  required: true,
                },
              ],
              initialValue: file,
              valuePropName: "file",
            })(<ChooseFile />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(ImportModal);
