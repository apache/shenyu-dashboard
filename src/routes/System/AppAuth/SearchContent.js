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

import React from "react";
import { Form, Input, Button } from 'antd';
import { getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from '../../../utils/AuthButton';
import styles from "./index.less";

class InlineSearch extends React.Component {

  handleSubmit = e => {
    e.preventDefault();
    const searchCont = this.props.form.getFieldsValue()
    this.props.onClick(searchCont)

  };

  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <Form layout="inline" onSubmit={this.handleSubmit}>
        <Form.Item className={styles.formInput}>
          {getFieldDecorator('appKey', {
            initialValue: null
          })(
            <Input
              placeholder={getIntlContent("SHENYU.AUTH.INPUTAPPKEY")}
            />,
          )}
        </Form.Item>
        <Form.Item className={styles.formInput}>
          {getFieldDecorator('phone', {
            initialValue: null
          })(
            <Input
              type="phone"
              placeholder={getIntlContent("SHENYU.AUTH.TELPHONE")}
            />,
          )}
        </Form.Item>
        <Form.Item className={styles.formItem}>
          <AuthButton perms="system:authen:list">
            <Button type="primary" htmlType="submit">
              {getIntlContent("SHENYU.SYSTEM.SEARCH")}
            </Button>
          </AuthButton>
        </Form.Item>
      </Form>
    );
  }
}
const SearchContent = Form.create({})(InlineSearch);
export default SearchContent
