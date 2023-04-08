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
import React, {Fragment, useEffect, useState} from "react";

const { Text } = Typography;

function HeadersEditor(props) {
  const {value: propsValue, onChange, buttonText} = props;
  const jsonObj = JSON.parse(propsValue || '{}');
  const [value, onChangeValue] =useState(Object.keys(jsonObj).map((key, index) => ({index, key, value: jsonObj[key]})));

  useEffect(
    () => {
      onChangeValue(Object.keys(jsonObj).map((key, index) => ({index, key, value: jsonObj[key]})))
    },
    [propsValue]
  );

  const onChangeItem = (e, key, index) => {
    let newValue = value.map(
      item => (item.index === index ? { ...item, [key]: e } : item)
    );
    onChangeValue(newValue);
    onChange(format(newValue));
  };

  const onDeleteItem = key => {
    let newValue = value.filter(item => item.key !== key);
    onChangeValue(newValue);
    onChange(format(newValue));
  };

  const onAddItem = () => {
    let newValue = [
      ...value,
      {index: value.length, key: "", value: ""}
    ];
    onChangeValue(newValue);
    onChange(format(newValue));
  };

  const format = (param) => {
    const newObject = param.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    return JSON.stringify(newObject);
  }

  return (
    <Row gutter={16}>
      {value.map(item => (
        <Fragment key={item.index}>
          <Col span={6}>
            <Input
              allowClear
              value={item.key}
              readOnly={false}
              onChange={e => onChangeItem(e.target.value, "key", item.index)}
            />
          </Col>
          <Col span={16}>
            <Input
              allowClear
              value={item.value}
              readOnly={false}
              onChange={e => onChangeItem(e.target.value, "value", item.index)}
            />
          </Col>
          <Col span={2} style={{ textAlign: "center" }}>
            {!item.required && (
              <Text type="danger">
                <Icon
                  style={{ fontSize: "16px" }}
                  type="minus-circle-o"
                  onClick={() => onDeleteItem(item.key)}
                />
              </Text>
            )}
          </Col>
        </Fragment>
      ))}

      <Col span={24}>
        <Button block type="dashed" onClick={onAddItem}>
          <Icon type="plus" /> {buttonText}
        </Button>
      </Col>
    </Row>
  );
}

export default HeadersEditor;
