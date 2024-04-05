/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable no-unused-expressions */
/* eslint-disable react/static-property-placement */
import { Modal, Form, Input, message } from "antd";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { getIntlContent } from "../../../utils/IntlUtils";
import { addTag, updateTag } from "../../../services/api";

class AddAndUpdateTag extends Component {
  static defaultProps = {
    form: PropTypes.object,
    visible: PropTypes.bool,
    formLoaded: PropTypes.func,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
  };

  componentDidMount() {
    const { form, formLoaded } = this.props;
    formLoaded?.(form);
  }

  handleSubmit = () => {
    const {
      onOk,
      form: { validateFieldsAndScroll },
    } = this.props;
    validateFieldsAndScroll(async (err, values) => {
      if (!err) {
        const { id } = values;
        let res = {};
        if (!id) {
          // add
          res = await addTag(values);
        } else {
          // update
          res = await updateTag(values);
        }
        if (res.code !== 200) {
          message.error(res.message);
        } else {
          message.success(res.message);
          onOk?.(values);
        }
      }
    });
  };

  render() {
    const { onCancel, form, name = "", tagDesc = "", visible } = this.props;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 5 },
      },
      wrapperCol: {
        sm: { span: 19 },
      },
    };

    return (
      <Modal
        visible={visible}
        onCancel={onCancel}
        onOk={this.handleSubmit}
        forceRender
        title={getIntlContent("SHENYU.DOCUMENT.TAG")}
      >
        <Form className="login-form" {...formItemLayout}>
          <Form.Item label={getIntlContent("SHENYU.DOCUMENT.TAG.NAME")}>
            {getFieldDecorator("name", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.TAG.NAME"),
                },
              ],
              initialValue: name,
            })(
              <Input
                allowClear
                placeholder={getIntlContent("SHENYU.DOCUMENT.TAG.NAME")}
              />,
            )}
          </Form.Item>

          <Form.Item label={getIntlContent("SHENYU.DOCUMENT.TAG.DESC")}>
            {getFieldDecorator("tagDesc", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.TAG.DESC"),
                },
              ],
              initialValue: tagDesc,
            })(
              <Input
                allowClear
                placeholder={getIntlContent("SHENYU.DOCUMENT.TAG.DESC")}
              />,
            )}
          </Form.Item>

          <Form.Item hidden>
            {getFieldDecorator("parentTagId")(<Input allowClear />)}
          </Form.Item>

          <Form.Item hidden>
            {getFieldDecorator("id")(<Input allowClear />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddAndUpdateTag);
