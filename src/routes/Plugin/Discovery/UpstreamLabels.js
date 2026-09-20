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

import React, { Component } from "react";
import {
  Alert,
  Button,
  Empty,
  Form,
  Input,
  Popover,
  Tag,
  Typography,
} from "antd";
import { getIntlContent } from "../../../utils/IntlUtils";
import {
  getUpstreamLabels,
  parseUpstreamProps,
  validateLabelRows,
} from "../../../utils/upstreamLabels";
import styles from "./UpstreamLabels.less";

const text = (key) => getIntlContent(`SHENYU.UPSTREAM.LABELS.${key}`);

export function UpstreamLabelSummary({ record }) {
  let labels;
  try {
    labels = getUpstreamLabels(record.props);
  } catch (error) {
    return <Typography.Text type="danger">{text("INVALID")}</Typography.Text>;
  }
  const keys = Object.keys(labels);
  if (!keys.length)
    return <Typography.Text type="secondary">{text("EMPTY")}</Typography.Text>;
  const renderTag = (key) => (
    <Tag key={key} color="blue" title={`${key}=${labels[key]}`}>
      {key}={labels[key]}
    </Tag>
  );
  return (
    <div className={styles.summary}>
      {keys.slice(0, 2).map(renderTag)}
      {keys.length > 2 && (
        <Popover
          title={text("TITLE")}
          trigger="click"
          content={
            <div className={styles.allLabels}>{keys.map(renderTag)}</div>
          }
        >
          <Button type="link" size="small" aria-label={text("VIEW_ALL")}>
            +{keys.length - 2}
          </Button>
        </Popover>
      )}
    </div>
  );
}

export default class UpstreamLabels extends Component {
  constructor(props) {
    super(props);
    this.nextId = 0;
    let rows = [];
    let invalid = false;
    try {
      const labels = getUpstreamLabels(props.record.props);
      rows = Object.keys(labels).map((key) => ({
        id: this.createId(),
        key,
        value: labels[key],
      }));
    } catch (e) {
      invalid = true;
    }
    this.state = { rows, errors: [], invalid };
  }

  createId = () => {
    this.nextId += 1;
    return this.nextId;
  };

  update = (id, field, value) => {
    this.setState(({ rows }) => ({
      rows: rows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
      errors: [],
    }));
  };

  // Read and validate the draft only when the whole upstream row is saved.
  // eslint-disable-next-line react/no-unused-class-component-methods
  validate = () => {
    const { rows, invalid } = this.state;
    if (invalid) return;
    const errors = validateLabelRows(rows);
    if (errors.some(Boolean)) {
      this.setState({ errors });
      return;
    }
    const labels = Object.create(null);
    rows.forEach(({ key, value }) => {
      labels[key] = value;
    });
    const { record } = this.props;
    // Editing other fields must not add labels to legacy instances.
    if (
      JSON.stringify(labels) === JSON.stringify(getUpstreamLabels(record.props))
    ) {
      return { props: record.props };
    }
    return {
      props: JSON.stringify({ ...parseUpstreamProps(record.props), labels }),
    };
  };

  render() {
    const { width } = this.props;
    const { rows, errors, invalid } = this.state;
    return (
      <div className={styles.editor} style={{ width }}>
        <div className={styles.heading}>
          <strong>{text("EDIT")}</strong>
        </div>
        {invalid ? (
          <Alert type="error" showIcon message={text("INVALID")} />
        ) : (
          <>
            <div className={styles.header}>
              <span>{text("KEY")}</span>
              <span>{text("VALUE")}</span>
              <span />
            </div>
            <div className={styles.rows}>
              {rows.length === 0 && (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={text("EMPTY_HINT")}
                />
              )}
              {rows.map((row, index) => (
                <div className={styles.row} key={row.id}>
                  <Form.Item
                    validateStatus={errors[index] ? "error" : ""}
                    help={errors[index] ? text(errors[index]) : undefined}
                  >
                    <Input
                      aria-label={`${text("KEY")} ${index + 1}`}
                      placeholder="release"
                      value={row.key}
                      onChange={(e) =>
                        this.update(row.id, "key", e.target.value)
                      }
                    />
                  </Form.Item>
                  <Form.Item
                    validateStatus={errors[index] === "REQUIRED" ? "error" : ""}
                  >
                    <Input
                      aria-label={`${text("VALUE")} ${index + 1}`}
                      placeholder="canary"
                      value={row.value}
                      onChange={(e) =>
                        this.update(row.id, "value", e.target.value)
                      }
                    />
                  </Form.Item>
                  <Button
                    icon="delete"
                    type="link"
                    aria-label={`${text("REMOVE")} ${index + 1}`}
                    title={text("REMOVE")}
                    onClick={() =>
                      this.setState({
                        rows: rows.filter((item) => item.id !== row.id),
                        errors: [],
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </>
        )}
        <div className={styles.actions}>
          <Button
            type="dashed"
            icon="plus"
            disabled={invalid}
            onClick={() =>
              this.setState({
                rows: [...rows, { id: this.createId(), key: "", value: "" }],
                errors: [],
              })
            }
          >
            {text("ADD")}
          </Button>
        </div>
      </div>
    );
  }
}
