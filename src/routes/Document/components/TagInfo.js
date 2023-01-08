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

import { Typography, Card, Form, Input} from "antd";
import Paragraph from "antd/lib/skeleton/Paragraph";
import React, { useContext } from "react";
import TagContext from "./TagContext";


const { Title, Text } = Typography;

const abc = "33333";
const formItemLayout = {
  labelCol: {
    sm: { span: 5 }
  },
  wrapperCol: {
    sm: { span: 19 }
  }
};

function TagInfo(props) {
  const {
    tagData: { envProps = [] },
    tagDetail
  } = useContext(TagContext);

  return (
    <>
      <Form>
        <Form.Item
          label="Password"
          name="password"
          value
          rules={[{ required: true, message: 'Please input your password!' }]}
        />
      </Form>
    </>
  );
}

export default TagInfo;
