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

import React, {
  Component,
  forwardRef,
  useRef,
  useImperativeHandle,
} from "react";
import Button from "@douyinfe/semi-ui/lib/es/button";
import { connect } from "react-redux";
import Modal from "../ui/Modal";
import Form from "../ui/Form";
import Select from "../ui/Select";
import { getIntlContent } from "../../utils/IntlUtils";
import { defaultNamespaceId } from "../_utils/utils";

const FormItem = Form.Item;
const ChooseFile = forwardRef(({ onChange, file, id }, ref) => {
  const inputRef = useRef(null);
  useImperativeHandle(ref, () => inputRef.current);
  const handleFileInput = (e) => {
    onChange(e.target.files[0]);
  };
  return (
    <>
      <Button
        htmlType="button"
        type="primary"
        theme="light"
        onClick={() => {
          inputRef.current.click();
        }}
      >
        {getIntlContent("SHENYU.COMMON.UPLOAD")}
      </Button>{" "}
      {file?.name}
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileInput}
        style={{ display: "none" }}
        id={id}
        aria-label={getIntlContent("SHENYU.COMMON.UPLOAD")}
      />
    </>
  );
});

@connect(({ global }) => ({
  platform: global.platform,
  namespaces: global.namespaces,
}))
class ImportModal extends Component {
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

  render() {
    const { handleCancel, form, file, namespaces } = this.props;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 7 },
      },
      wrapperCol: {
        sm: { span: 17 },
      },
    };

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
              initialValue: defaultNamespaceId,
            })(
              <Select
                showSearch
                placeholder={getIntlContent("SHENYU.SYSTEM.NAMESPACE")}
              >
                {namespaces.map((namespace) => (
                  <Select.Option
                    key={namespace.namespaceId}
                    value={namespace.namespaceId}
                  >
                    {namespace.name}
                  </Select.Option>
                ))}
              </Select>,
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
