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

import { Col, Input, Row, Button, Icon } from "antd";
import React, { Fragment, useEffect, useRef, useState } from "react";
import { getIntlContent } from "../../../utils/IntlUtils";

export const parseRows = (str) => {
  try {
    const parsed = JSON.parse(str || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const getNextEditorRowIndex = (rows) =>
  rows.reduce(
    (maxIndex, item) =>
      Number.isInteger(item.index) ? Math.max(maxIndex, item.index) : maxIndex,
    -1,
  ) + 1;

export const normalizeEditorRows = (rows) => {
  const usedIndexes = new Set();
  let nextIndex = getNextEditorRowIndex(rows);

  return rows.map((item) => {
    if (Number.isInteger(item.index) && !usedIndexes.has(item.index)) {
      usedIndexes.add(item.index);
      return item;
    }

    while (usedIndexes.has(nextIndex)) {
      nextIndex += 1;
    }
    const normalized = { ...item, index: nextIndex };
    usedIndexes.add(nextIndex);
    nextIndex += 1;
    return normalized;
  });
};

function HeadersEditor(props) {
  const { value: propsValue, onChange, buttonText } = props;
  const [value, setValue] = useState(() =>
    normalizeEditorRows(parseRows(propsValue)),
  );
  // skip re-normalising the value just emitted, so typing does not rebuild rows
  const lastEmitted = useRef(null);

  useEffect(() => {
    if (propsValue !== lastEmitted.current) {
      setValue(normalizeEditorRows(parseRows(propsValue)));
      // the applied external value is now the sync baseline, not a stale echo
      lastEmitted.current = propsValue;
    }
  }, [propsValue]);

  const onChangeItem = (e, key, index) => {
    changeValue(
      value.map((item) =>
        item.index === index ? { ...item, [key]: e } : item,
      ),
    );
  };

  const onDeleteItem = (index) => {
    changeValue(value.filter((item) => item.index !== index));
  };

  const onAddItem = () => {
    changeValue([
      ...value,
      { index: getNextEditorRowIndex(value), key: "", value: "" },
    ]);
  };

  const changeValue = (newValue) => {
    setValue(newValue);
    lastEmitted.current = JSON.stringify(newValue);
    onChange(lastEmitted.current);
  };

  return (
    <Row gutter={16}>
      {value.map((item) => (
        <Fragment key={item.index}>
          <Col span={6}>
            <Input
              allowClear
              value={item.key}
              readOnly={false}
              onChange={(e) => onChangeItem(e.target.value, "key", item.index)}
            />
          </Col>
          <Col span={16}>
            <Input
              allowClear
              value={item.value}
              readOnly={false}
              onChange={(e) =>
                onChangeItem(e.target.value, "value", item.index)
              }
            />
          </Col>
          <Col span={2} style={{ textAlign: "center" }}>
            <Button
              type="link"
              aria-label={getIntlContent("SHENYU.COMMON.DELETE")}
              onClick={() => onDeleteItem(item.index)}
              style={{ padding: 0, height: "auto", color: "#f5222d" }}
            >
              <Icon style={{ fontSize: "16px" }} type="minus-circle-o" />
            </Button>
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
