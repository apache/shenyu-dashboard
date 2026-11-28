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
import Form from "../../../components/ui/Form";
import Input from "../../../components/ui/Input";
import Switch from "../../../components/ui/Switch";
import { getIntlContent } from "../../../utils/IntlUtils";

const layout = {
  labelCol: { sm: { span: 4 } },
  wrapperCol: { sm: { span: 20 } },
};
const text = (key) => getIntlContent(`SHENYU.SHADOW.${key}`);
const field = (name) => `shadow_${name}`;
const maxInteger = 2147483647;
const numbers = [
  ["sampleRate", "SAMPLE_RATE", 0, 0, 1],
  ["maxConcurrent", "MAX_CONCURRENT", 8, 1, maxInteger],
  ["queueCapacity", "QUEUE_CAPACITY", 64, 0, maxInteger],
  ["timeoutMillis", "TIMEOUT", 1000, 1, maxInteger],
  ["maxRequestBodyBytes", "REQUEST_BYTES", 65536, 0, maxInteger],
  ["maxResponseBodyBytes", "RESPONSE_BYTES", 65536, 0, maxInteger],
];
const lists = [
  ["methods", "METHODS", ["GET", "HEAD", "OPTIONS", "TRACE"]],
  ["forwardHeaders", "FORWARD_HEADERS", ["Accept", "Content-Type"]],
  ["compareHeaders", "COMPARE_HEADERS", ["Content-Type"]],
  ["ignoreJsonPaths", "IGNORE_JSON_PATHS", []],
];
const lines = (value = "") =>
  value
    .split(/\r?\n/)
    .map((part) => part.trim())
    .filter(Boolean);
const isObject = (value) =>
  value != null && typeof value === "object" && !Array.isArray(value);
const validate = (check, key) => ({
  validator: (_, value, callback) =>
    callback(check(value) ? undefined : text(key)),
});

function readHandle(handle) {
  if (!handle) return {};
  try {
    const parsed = JSON.parse(handle);
    return isObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function validTarget(value = "") {
  const authority = /^https?:\/\/([^/]+)/i.exec(value);
  if (!authority || authority[1].includes("@") || /[\s\\?#]/.test(value))
    return false;
  try {
    return Boolean(new URL(value).hostname);
  } catch {
    return false;
  }
}

function readHeaders(value = "") {
  if (!value.trim()) return {};
  try {
    const headers = JSON.parse(value);
    return isObject(headers) &&
      Object.entries(headers).every(
        ([name, headerValue]) =>
          /^[!#$%&'*+.^_`|~\w-]+$/.test(name) &&
          typeof headerValue === "string" &&
          !/[\r\n]/.test(headerValue),
      )
      ? headers
      : null;
  } catch {
    return null;
  }
}

export function serializeShadowRuleHandle(handle, values) {
  const original = readHandle(handle);
  if (!original) return undefined;
  return JSON.stringify({
    ...original,
    enabled: values[field("enabled")] === true,
    target: values[field("target")] || null,
    ...Object.fromEntries(
      numbers.map(([name]) => [name, Number(values[field(name)])]),
    ),
    ...Object.fromEntries(
      lists.map(([name]) => [name, lines(values[field(name)])]),
    ),
    extraHeaders: readHeaders(values[field("extraHeaders")]),
  });
}

export default function ShadowRuleHandle({ form, handle }) {
  const original = readHandle(handle);
  if (!original) return <p role="alert">{text("HANDLE_INVALID")}</p>;

  const { getFieldDecorator, getFieldValue } = form;
  const enabled = getFieldValue(field("enabled")) ?? original.enabled === true;
  const input = (name, label, initialValue, rules, control) => (
    <Form.Item key={name} label={text(label)} {...layout}>
      {getFieldDecorator(field(name), { initialValue, rules })(control)}
    </Form.Item>
  );
  return (
    <section aria-label={text("CONFIGURATION")}>
      <Form.Item label={text("ENABLE")} {...layout}>
        {getFieldDecorator(field("enabled"), {
          initialValue: original.enabled === true,
          valuePropName: "checked",
        })(<Switch aria-label={text("ENABLE")} />)}
      </Form.Item>
      {input(
        "target",
        "TARGET",
        original.target ?? "",
        [
          validate(
            (value) => (!enabled && !value) || validTarget(value),
            "TARGET_INVALID",
          ),
        ],
        <Input
          aria-label={text("TARGET")}
          placeholder="https://candidate.example"
        />,
      )}
      {numbers.map(([name, label, initial, min, max]) =>
        input(
          name,
          label,
          String(original[name] ?? initial),
          [
            validate((value) => {
              const number = Number(value);
              return (
                Boolean(value?.trim()) &&
                number >= min &&
                number <= max &&
                (name === "sampleRate" || Number.isInteger(number))
              );
            }, `${label}_INVALID`),
          ],
          <Input
            aria-label={text(label)}
            inputMode={name === "sampleRate" ? "decimal" : "numeric"}
          />,
        ),
      )}
      {lists.map(([name, label, initial]) =>
        input(
          name,
          label,
          Array.isArray(original[name])
            ? original[name].join("\n")
            : initial.join("\n"),
          name === "methods"
            ? [
                validate(
                  (value) => !enabled || lines(value).length > 0,
                  "METHODS_INVALID",
                ),
              ]
            : [],
          <Input.TextArea
            aria-label={text(label)}
            placeholder={text("ONE_PER_LINE")}
            rows={2}
          />,
        ),
      )}
      {input(
        "extraHeaders",
        "EXTRA_HEADERS",
        original.extraHeaders == null
          ? ""
          : JSON.stringify(original.extraHeaders, null, 2),
        [
          validate(
            (value) => readHeaders(value) !== null,
            "EXTRA_HEADERS_INVALID",
          ),
        ],
        <Input.TextArea
          aria-label={text("EXTRA_HEADERS")}
          placeholder={text("EXTRA_HEADERS_EXAMPLE")}
          rows={2}
        />,
      )}
    </section>
  );
}
