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

import { Col, Input, Row, Button, Icon, Typography } from "antd";
import React, { Fragment } from "react";

const { Text } = Typography;

function HeadersEditor(props) {
  const { value, onChange } = props;
  const onChangeItem = (e, key, id) => {
    onChange(
      value.map(
        item => (item.id === id ? { ...item, [key]: e.target.value } : item)
      )
    );
  };

  const onDeleteItem = id => {
    onChange(value.filter(item => item.id !== id));
  };

  const onAddItem = () => {
    onChange([
      ...value,
      { id: `${Date.now()}`, name: "", example: "", required: false }
    ]);
  };

  return (
    <Row gutter={16}>
      {value.map(item => (
        <Fragment key={item.id}>
          <Col span={6}>
            <Input
              allowClear
              value={item.name}
              readOnly={item.required}
              onChange={e => onChangeItem(e, "name", item.id)}
            />
          </Col>
          <Col span={16}>
            <Input
              allowClear
              value={item.example}
              placeholder={item.description}
              prefix={
                item.required && (
                  <Text type="danger" strong>
                    *
                  </Text>
                )
              }
              onChange={e => onChangeItem(e, "example", item.id)}
            />
          </Col>
          <Col span={2} style={{ textAlign: "center" }}>
            {!item.required && (
              <Text type="danger">
                <Icon
                  style={{ fontSize: "16px" }}
                  type="minus-circle-o"
                  onClick={() => onDeleteItem(item.id)}
                />
              </Text>
            )}
          </Col>
        </Fragment>
      ))}

      <Col span={24}>
        <Button block type="dashed" onClick={onAddItem}>
          <Icon type="plus" /> Add header
        </Button>
      </Col>
    </Row>
  );
}

export default HeadersEditor;
