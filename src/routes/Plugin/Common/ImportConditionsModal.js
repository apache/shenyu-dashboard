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
import { Alert, Button, Checkbox, Input, Modal, Tag } from "antd";
import {
  buildConditionDrafts,
  toConditions,
} from "../../../utils/conditionDraft";
import { parseRequestSample } from "../../../utils/requestSample";

const { TextArea } = Input;

class ImportConditionsModal extends Component {
  constructor(props) {
    super(props);
    this.state = { text: "", drafts: [], selected: [], sample: null };
  }

  handleParse = () => {
    this.setState((previous) => {
      const sample = parseRequestSample(previous.text);
      const drafts = buildConditionDrafts(sample);
      return {
        sample,
        drafts,
        selected: drafts
          .filter((item) => item.selected)
          .map((item) => item.key),
      };
    });
  };

  handleToggle = (key, checked) => {
    this.setState((previous) => {
      const selected = previous.selected.filter((item) => item !== key);
      return { selected: checked ? selected.concat(key) : selected };
    });
  };

  handleApply = () => {
    const conditions = toConditions(this.state.drafts, this.state.selected);
    if (conditions.length === 0) {
      return;
    }
    this.props.onApply(conditions);
    this.reset();
  };

  handleCancel = () => {
    this.reset();
    this.props.onCancel();
  };

  reset = () => {
    this.setState({ text: "", drafts: [], selected: [], sample: null });
  };

  renderIssues = () => {
    const { sample } = this.state;
    if (!sample || sample.issues.length === 0) {
      return null;
    }
    return (
      <Alert
        type="warning"
        showIcon
        message="This sample is only partly supported"
        description={
          <ul>
            {sample.issues.map((issue) => (
              <li key={`${issue.code}-${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        }
      />
    );
  };

  renderDrafts = () => {
    const { drafts, selected } = this.state;
    return drafts.map((item) => (
      <div key={item.key} style={{ marginBottom: 8 }}>
        <Checkbox
          checked={selected.indexOf(item.key) !== -1}
          onChange={(e) => this.handleToggle(item.key, e.target.checked)}
        >
          {item.label}
        </Checkbox>
        {item.sensitive && <Tag color="red">credential</Tag>}
        <code style={{ marginLeft: 8 }}>
          {item.condition.paramType} {item.condition.operator}{" "}
          {item.condition.paramName} {item.condition.paramValue}
        </code>
      </div>
    ));
  };

  render() {
    const { visible } = this.props;
    const { drafts, selected } = this.state;
    return (
      <Modal
        visible={visible}
        title="Import from cURL or HTTP request"
        width={720}
        onCancel={this.handleCancel}
        footer={[
          <Button key="cancel" onClick={this.handleCancel}>
            Cancel
          </Button>,
          <Button key="parse" onClick={this.handleParse}>
            Parse
          </Button>,
          <Button
            key="apply"
            type="primary"
            disabled={selected.length === 0}
            onClick={this.handleApply}
          >
            Apply selected
          </Button>,
        ]}
      >
        <TextArea
          rows={6}
          value={this.state.text}
          onChange={(e) => this.setState({ text: e.target.value })}
          placeholder="curl 'https://api.example.com/orders/123' -H 'X-Version: v2'"
        />
        <p>
          Parsing is local. Nothing is sent, executed or saved until you apply
          and submit the form. Only the request path and method are selected by
          default; a single sample does not establish routing intent.
        </p>
        {this.renderIssues()}
        {drafts.length > 0 && <div>{this.renderDrafts()}</div>}
      </Modal>
    );
  }
}

export default ImportConditionsModal;
