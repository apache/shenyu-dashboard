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

import { Typography, Button, Row, Col } from "antd";
import React, { useContext } from "react";
import ApiContext from "./ApiContext";
import { getIntlContent } from "../../../utils/IntlUtils";

const { Title, Text, Paragraph } = Typography;

function TagInfo(props) {
  const { handleDelete, handleUpdate } = props;
  const { tagDetail } = useContext(ApiContext);

  return (
    <Row gutter={24}>
      <Col span={12}>
        <Title level={2}>{tagDetail.name}</Title>
      </Col>
      <Col span={12} style={{ textAlign: "right" }}>
        <Button onClick={handleUpdate}>
          {getIntlContent("SHENYU.BUTTON.SYSTEM.EDIT")}
        </Button>
        &nbsp;&nbsp;
        <Button ghost type="danger" onClick={handleDelete}>
          {getIntlContent("SHENYU.BUTTON.SYSTEM.DELETE")}
        </Button>
      </Col>
      <Col span={24}>
        <Paragraph>
          <Title level={4}>{getIntlContent("SHENYU.DOCUMENT.TAG.DESC")}</Title>
          <Text>{tagDetail.tagDesc}</Text>
          <Title level={4}>{getIntlContent("SHENYU.DOCUMENT.TAG.EXT")}</Title>
          <Text code>{tagDetail.ext}</Text>
        </Paragraph>
      </Col>
    </Row>
  );
}

export default TagInfo;
