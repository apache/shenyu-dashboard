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
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Switch,
  Tag,
} from "antd";
import { getIntlContent } from "../../../utils/IntlUtils";
import {
  createCanaryDraft,
  hasParameterName,
  parseDivideHandle,
  serializeCanaryDraft,
  validateCanaryDraft,
} from "../../../utils/canary";
import styles from "./CanaryRuleHandle.less";

const text = (key) => getIntlContent(`SHENYU.CANARY.${key}`);
const { Option } = Select;

export default class CanaryRuleHandle extends Component {
  constructor(props) {
    super(props);
    let draft = null;
    let invalid = false;
    try {
      const { canary } = parseDivideHandle(props.handle);
      if (canary != null) draft = createCanaryDraft(canary);
    } catch (e) {
      invalid = true;
    }
    this.state = { draft, invalid, dirty: false, expanded: false, errors: {} };
  }

  // eslint-disable-next-line react/no-unused-class-component-methods
  getData = () => {
    const { draft, dirty, invalid } = this.state;
    if (invalid) {
      this.setState({ expanded: true });
      return { valid: false };
    }
    if (!draft) return { valid: true, canary: dirty ? null : undefined };
    const errors = validateCanaryDraft(draft, this.props.dictionaries);
    if (Object.keys(errors).length) {
      this.setState({ errors, expanded: true });
      return { valid: false };
    }
    return {
      valid: true,
      canary: dirty ? serializeCanaryDraft(draft) : undefined,
    };
  };

  update = (fields) => {
    this.setState(({ draft }) => ({
      draft: { ...draft, ...fields },
      dirty: true,
      errors: {},
    }));
  };

  updateRow = (group, index, field, value) => {
    this.update({
      [group]: this.state.draft[group].map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      ),
    });
  };

  error = (key) => {
    const error = this.state.errors[key];
    return error ? (
      <div className={styles.error} role="alert">
        {text(error)}
      </div>
    ) : null;
  };

  renderOptions = (items, current) => {
    const options = items || [];
    const choices = options.map((item) => (
      <Option key={item.dictValue} value={item.dictValue}>
        {item.dictName}
      </Option>
    ));
    if (current && !options.some((item) => item.dictValue === current)) {
      choices.push(
        <Option key={current} value={current}>
          {current}
        </Option>,
      );
    }
    return choices;
  };

  renderLabels = (group) => {
    const name = `${group}Rows`;
    const rows = this.state.draft[name];
    const label = text(group === "stable" ? "STABLE_LABELS" : "CANARY_LABELS");
    return (
      <section aria-label={label}>
        <div className={styles.fieldLabel}>{label}</div>
        <div className={styles.labelHeader}>
          <span>{text("KEY")}</span>
          <span>{text("VALUE")}</span>
          <span />
        </div>
        {rows.map((row, index) => (
          <div key={index} className={styles.labelRow}>
            <Input
              aria-label={`${label} ${text("KEY")} ${index + 1}`}
              value={row.key}
              placeholder="release"
              onChange={(event) =>
                this.updateRow(name, index, "key", event.target.value)
              }
            />
            <Input
              aria-label={`${label} ${text("VALUE")} ${index + 1}`}
              value={row.value}
              placeholder={group}
              onChange={(event) =>
                this.updateRow(name, index, "value", event.target.value)
              }
            />
            <Button
              type="link"
              icon="delete"
              aria-label={`${label} ${text("REMOVE_LABEL")} ${index + 1}`}
              onClick={() =>
                this.update({ [name]: rows.filter((_, i) => i !== index) })
              }
            />
            {this.error(`${group}.${index}`)}
          </div>
        ))}
        {this.error(group)}
        <Button
          type="dashed"
          icon="plus"
          onClick={() =>
            this.update({ [name]: [...rows, { key: "", value: "" }] })
          }
        >
          {text("ADD_LABEL")}
        </Button>
      </section>
    );
  };

  renderConditions = () => {
    const { draft } = this.state;
    const { paramType, operator } = this.props.dictionaries;
    return (
      <section className={styles.block} aria-label={text("CONDITIONS")}>
        <div className={styles.blockHeader}>
          <span>{text("CONDITIONS")}</span>
          <Select
            aria-label={text("MATCH_MODE")}
            value={draft.matchMode}
            onChange={(matchMode) => this.update({ matchMode })}
          >
            <Option value={0}>{text("AND")}</Option>
            <Option value={1}>{text("OR")}</Option>
          </Select>
        </div>
        {this.error("matchMode")}
        {draft.conditions.length === 0 && (
          <div className={styles.empty}>{text("ALL_REQUESTS")}</div>
        )}
        {draft.conditions.map((condition, index) => (
          <div className={styles.conditionRow} key={index}>
            <Select
              aria-label={`${text("SOURCE")} ${index + 1}`}
              value={condition.paramType}
              onChange={(value) =>
                this.update({
                  conditions: draft.conditions.map((row, i) =>
                    i === index
                      ? { ...row, paramType: value, paramName: "" }
                      : row,
                  ),
                })
              }
            >
              {this.renderOptions(paramType, condition.paramType)}
            </Select>
            <Input
              aria-label={`${text("PARAM_NAME")} ${index + 1}`}
              placeholder={text("PARAM_NAME")}
              disabled={!hasParameterName(condition.paramType)}
              value={condition.paramName}
              onChange={(event) =>
                this.updateRow(
                  "conditions",
                  index,
                  "paramName",
                  event.target.value,
                )
              }
            />
            <Select
              aria-label={`${text("OPERATOR")} ${index + 1}`}
              value={condition.operator}
              onChange={(value) =>
                this.update({
                  conditions: draft.conditions.map((row, i) =>
                    i === index
                      ? {
                          ...row,
                          operator: value,
                          ...(value === "isBlank" ? { paramValue: "" } : {}),
                        }
                      : row,
                  ),
                })
              }
            >
              {this.renderOptions(operator, condition.operator)}
            </Select>
            <Input
              aria-label={`${text("CONDITION_VALUE")} ${index + 1}`}
              placeholder={
                ["TimeBefore", "TimeAfter"].includes(condition.operator)
                  ? "YYYY-MM-DD HH:mm:ss"
                  : text("VALUE")
              }
              disabled={condition.operator === "isBlank"}
              value={condition.paramValue}
              onChange={(event) =>
                this.updateRow(
                  "conditions",
                  index,
                  "paramValue",
                  event.target.value,
                )
              }
            />
            <Button
              type="link"
              icon="delete"
              aria-label={`${text("REMOVE_CONDITION")} ${index + 1}`}
              onClick={() =>
                this.update({
                  conditions: draft.conditions.filter((_, i) => i !== index),
                })
              }
            />
            {this.error(`condition.${index}`)}
          </div>
        ))}
        <Button
          type="dashed"
          icon="plus"
          onClick={() =>
            this.update({
              conditions: [
                ...draft.conditions,
                {
                  paramType: "header",
                  paramName: "",
                  operator: "=",
                  paramValue: "",
                },
              ],
            })
          }
        >
          {text("ADD_CONDITION")}
        </Button>
      </section>
    );
  };

  render() {
    const { draft, invalid, expanded } = this.state;
    const { dictionaries } = this.props;
    return (
      <Form.Item
        label="Canary"
        labelCol={{ sm: { span: 4 } }}
        wrapperCol={{ sm: { span: 20 } }}
      >
        <div className={styles.editor}>
          {!draft && !invalid ? (
            <Button
              icon="plus"
              type="dashed"
              onClick={() =>
                this.setState({
                  draft: createCanaryDraft(),
                  dirty: true,
                  expanded: true,
                  errors: {},
                })
              }
            >
              {text("ADD_CONFIG")}
            </Button>
          ) : (
            <>
              <div className={styles.heading}>
                <Button
                  type="link"
                  icon={expanded ? "down" : "right"}
                  aria-expanded={expanded}
                  aria-label={text("CONFIG")}
                  onClick={() => this.setState({ expanded: !expanded })}
                >
                  {text("CONFIG")}
                </Button>
                {draft && (
                  <Tag color={draft.enabled ? "blue" : undefined}>
                    {draft.enabled
                      ? `${text("ENABLED")} · ${draft.percentage == null ? "—" : draft.percentage}%`
                      : text("STABLE_ONLY")}
                  </Tag>
                )}
                <div className={styles.actions}>
                  {draft && (
                    <span className={styles.toggle}>
                      {text("ENABLE")}{" "}
                      <Switch
                        size="small"
                        checked={draft.enabled === true}
                        aria-label={text("ENABLE")}
                        onChange={(enabled) => this.update({ enabled })}
                      />
                    </span>
                  )}
                  <Popconfirm
                    title={text("REMOVE_CONFIRM")}
                    okText={getIntlContent("SHENYU.COMMON.SURE")}
                    cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
                    onConfirm={() =>
                      this.setState({
                        draft: null,
                        invalid: false,
                        dirty: true,
                        errors: {},
                      })
                    }
                  >
                    <Button type="link">{text("REMOVE_CONFIG")}</Button>
                  </Popconfirm>
                </div>
              </div>
              {invalid && (
                <Alert type="error" showIcon message={text("INVALID")} />
              )}
              {expanded && draft && (
                <div className={styles.content}>
                  {this.error("enabled")}
                  <div className={styles.labelGroups}>
                    {this.renderLabels("stable")}
                    {this.renderLabels("canary")}
                  </div>
                  {this.error("partition")}
                  {this.renderConditions()}
                  <div className={styles.routing}>
                    <div>
                      <div className={styles.fieldLabel}>
                        {text("PERCENTAGE")}
                      </div>
                      <InputNumber
                        min={0}
                        max={100}
                        aria-label={text("PERCENTAGE")}
                        value={draft.percentage}
                        onChange={(percentage) => this.update({ percentage })}
                      />{" "}
                      %{this.error("percentage")}
                    </div>
                    <div>
                      <div className={styles.fieldLabel}>
                        {text("STICKY_KEY")}
                        {draft.enabled &&
                          draft.percentage > 0 &&
                          draft.percentage < 100 && (
                            <span className={styles.required}> *</span>
                          )}
                      </div>
                      <div className={styles.source}>
                        <Select
                          allowClear
                          placeholder={text("SOURCE")}
                          aria-label={text("STICKY_SOURCE")}
                          value={draft.stickyKey.paramType || undefined}
                          onChange={(paramType) =>
                            this.update({
                              stickyKey: {
                                ...draft.stickyKey,
                                paramType: paramType || "",
                                paramName: "",
                              },
                            })
                          }
                        >
                          {this.renderOptions(
                            dictionaries.paramType,
                            draft.stickyKey.paramType,
                          )}
                        </Select>
                        <Input
                          placeholder={text("PARAM_NAME")}
                          aria-label={text("STICKY_PARAM")}
                          disabled={
                            !hasParameterName(draft.stickyKey.paramType)
                          }
                          value={draft.stickyKey.paramName}
                          onChange={(event) =>
                            this.update({
                              stickyKey: {
                                ...draft.stickyKey,
                                paramName: event.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      {this.error("stickyKey")}
                    </div>
                  </div>
                  <div className={styles.fallback}>
                    <div className={styles.fieldLabel}>{text("FALLBACK")}</div>
                    <Select
                      aria-label={text("FALLBACK")}
                      value={draft.fallbackPolicy}
                      onChange={(fallbackPolicy) =>
                        this.update({ fallbackPolicy })
                      }
                    >
                      <Option value="STABLE">{text("FALLBACK_STABLE")}</Option>
                      <Option value="REJECT">{text("FALLBACK_REJECT")}</Option>
                    </Select>
                    {this.error("fallbackPolicy")}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Form.Item>
    );
  }
}
