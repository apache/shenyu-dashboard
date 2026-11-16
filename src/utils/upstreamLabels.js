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

// Keep plugin-specific metadata when editing discovery upstreams.
export function parseUpstreamProps(props) {
  const parsed = typeof props === "string" ? JSON.parse(props || "{}") : props;
  if (parsed == null) return {};
  if (typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid upstream props");
  }
  return parsed;
}

export function getUpstreamLabels(props) {
  const { labels = {} } = parseUpstreamProps(props);
  if (
    !labels ||
    typeof labels !== "object" ||
    Array.isArray(labels) ||
    Object.keys(labels).some(
      (key) =>
        !key.trim() || typeof labels[key] !== "string" || !labels[key].trim(),
    )
  ) {
    throw new Error("Invalid upstream labels");
  }
  return labels;
}

export function validateLabelRows(rows) {
  const keys = new Set();
  return rows.map(({ key, value }) => {
    if (!key.trim() || !value.trim()) return "REQUIRED";
    if (keys.has(key)) return "DUPLICATE";
    keys.add(key);
    return "";
  });
}

export function serializeUpstreamProps(item) {
  return JSON.stringify({
    ...parseUpstreamProps(item.props),
    warmupTime: item.warmupTime,
    gray: `${item.gray}`,
  });
}
