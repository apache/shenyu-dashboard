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

  import { Modal, Form, Input} from "antd";
  import React, { Component } from "react";
  import { getIntlContent } from "../../../utils/IntlUtils";

  class AddAndUpdateTag extends Component {
    render() {
      const {
        onCancel,
        form,
        name = "",
        tagDesc = ""

      } = this.props;
      const { getFieldDecorator } = form;
      const formItemLayout = {
        labelCol: {
          sm: { span: 5 }
        },
        wrapperCol: {
          sm: { span: 19 }
        }
      };
      const handleSubmit = () => {
        const { handleOk } = this.props;
        let newValues = "";
        form.validateFieldsAndScroll((err, values) => {
          if (!err) {
            newValues = values;
          }
        });
        handleOk(newValues);
      };
      return (
        <Modal visible onCancel={onCancel} onOk={handleSubmit}>
          <Form onSubmit={handleSubmit} className="login-form">
            <Form.Item
              label={`${getIntlContent("SHENYU.DOCUMENT.TAG.NAME")}`}
              {...formItemLayout}
            >
              {getFieldDecorator("name", {
                rules: [
                  {
                    required: true,
                    message: getIntlContent("SHENYU.DOCUMENT.TAG.NAME")
                  }
                ],
                initialValue: name
              })(
                <Input
                  placeholder={getIntlContent(
                    "SHENYU.DOCUMENT.TAG.NAME"
                  )}
                />
              )}
            </Form.Item>

            <Form.Item
              label={`${getIntlContent("SHENYU.DOCUMENT.TAG.DESC")}`}
              {...formItemLayout}
            >
              {getFieldDecorator("tagDesc", {
                rules: [
                  {
                    required: true,
                    message: getIntlContent("SHENYU.DOCUMENT.TAG.DESC")
                  }
                ],
                initialValue: tagDesc
              })(
                <Input
                  placeholder={getIntlContent(
                    "SHENYU.DOCUMENT.TAG.DESC"
                  )}
                />
              )}
            </Form.Item>

          </Form>
        </Modal>
      );
    }
  }

  export default Form.create()(AddAndUpdateTag);
