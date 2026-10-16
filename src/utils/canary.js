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

import { validateLabelRows } from "./upstreamLabels";

const isObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value);
const blank = (value) => typeof value !== "string" || !value.trim();
export const needsParameterName = (type) =>
  ["header", "cookie", "query", "post"].includes(type);
export const hasParameterName = (type) =>
  type && !["uri", "host", "ip", "req_method", "domain"].includes(type);

export function parseDivideHandle(handle) {
  const value =
    typeof handle === "string" ? JSON.parse(handle || "{}") : handle || {};
  if (!isObject(value)) throw new Error("Invalid Divide handle");
  return value;
}

export function createCanaryDraft(config = {}) {
  if (!isObject(config)) throw new Error("Invalid Canary configuration");
  const rows = (labels) => {
    if (labels === undefined) return [];
    if (
      !isObject(labels) ||
      Object.values(labels).some((value) => typeof value !== "string")
    ) {
      throw new Error("Invalid Canary labels");
    }
    return Object.keys(labels).map((key) => ({ key, value: labels[key] }));
  };
  if (
    config.conditions !== undefined &&
    (!Array.isArray(config.conditions) ||
      config.conditions.some((condition) => !isObject(condition)))
  ) {
    throw new Error("Invalid Canary conditions");
  }
  if (
    config.stickyKey !== undefined &&
    (!isObject(config.stickyKey) || blank(config.stickyKey.paramType))
  )
    throw new Error("Invalid sticky key");
  return {
    enabled: false,
    percentage: 0,
    matchMode: 0,
    fallbackPolicy: "STABLE",
    ...config,
    stableRows: rows(config.stableLabels),
    canaryRows: rows(config.canaryLabels),
    conditions: (config.conditions || []).map((condition) => ({
      ...condition,
    })),
    stickyKey: { paramType: "", paramName: "", ...config.stickyKey },
  };
}

export function validateCanaryDraft(draft, dictionaries = {}) {
  const errors = {};
  const known = (items, value) =>
    !items || items.some((item) => item.dictValue === value);
  ["stable", "canary"].forEach((group) => {
    const rows = draft[`${group}Rows`];
    if (!rows.length) errors[group] = "LABELS_REQUIRED";
    validateLabelRows(rows).forEach((error, index) => {
      if (error) errors[`${group}.${index}`] = `LABEL_${error}`;
    });
  });
  if (
    !Object.keys(errors).length &&
    !draft.stableRows.some((stable) =>
      draft.canaryRows.some(
        (canary) => stable.key === canary.key && stable.value !== canary.value,
      ),
    )
  ) {
    errors.partition = "PARTITION_REQUIRED";
  }
  if (typeof draft.enabled !== "boolean") errors.enabled = "INVALID";
  if (
    !Number.isInteger(draft.percentage) ||
    draft.percentage < 0 ||
    draft.percentage > 100
  )
    errors.percentage = "PERCENTAGE_INVALID";
  if (![0, 1].includes(draft.matchMode)) errors.matchMode = "MATCH_INVALID";
  if (!["STABLE", "REJECT"].includes(draft.fallbackPolicy))
    errors.fallbackPolicy = "FALLBACK_INVALID";
  const sourceError = (source) => {
    if (blank(source.paramType)) return "SOURCE_REQUIRED";
    if (!known(dictionaries.paramType, source.paramType))
      return "SOURCE_INVALID";
    if (needsParameterName(source.paramType) && blank(source.paramName))
      return "PARAM_REQUIRED";
    if (source.paramName !== undefined && typeof source.paramName !== "string")
      return "PARAM_REQUIRED";
  };
  if (
    draft.stickyKey.paramType ||
    (draft.enabled && draft.percentage > 0 && draft.percentage < 100)
  ) {
    const error = sourceError(draft.stickyKey);
    if (error) errors.stickyKey = error;
  }
  draft.conditions.forEach((condition, index) => {
    let error = sourceError(condition);
    if (
      !error &&
      (blank(condition.operator) ||
        !known(dictionaries.operator, condition.operator))
    )
      error = "OPERATOR_REQUIRED";
    if (
      !error &&
      (typeof condition.paramValue !== "string" ||
        (condition.operator !== "isBlank" && blank(condition.paramValue)))
    )
      error = "VALUE_REQUIRED";
    // Java regex and date validation remains authoritative on the server.
    if (error) errors[`condition.${index}`] = error;
  });
  return errors;
}

export function serializeCanaryDraft(draft) {
  const { stableRows, canaryRows, stickyKey, ...config } = draft;
  const labels = (rows) => {
    const result = Object.create(null);
    rows.forEach(({ key, value }) => {
      result[key] = value;
    });
    return result;
  };
  return {
    ...config,
    stableLabels: labels(stableRows),
    canaryLabels: labels(canaryRows),
    ...(stickyKey.paramType ? { stickyKey: { ...stickyKey } } : {}),
  };
}

// undefined leaves the original canary (including null) alone; null explicitly removes it.
export function mergeDivideHandle(original, fields, canary) {
  const result = {
    ...parseDivideHandle(original),
    ...parseDivideHandle(fields),
  };
  if (canary === null) delete result.canary;
  else if (canary !== undefined) result.canary = canary;
  return JSON.stringify(result);
}
