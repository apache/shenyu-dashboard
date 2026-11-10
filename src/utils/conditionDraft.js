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

// Turns a normalized request sample into selector/rule condition drafts.
// Only path and method are selected by default; a single request sample does
// not establish routing intent for anything else.

const IGNORED_HEADERS = [
  "host",
  "content-length",
  "content-type",
  "connection",
  "accept",
  "accept-encoding",
  "accept-language",
  "user-agent",
  "origin",
  "referer",
  "te",
  "transfer-encoding",
  "upgrade",
];

const SENSITIVE_NAMES = [
  "authorization",
  "proxy-authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "api-key",
  "x-auth-token",
  "x-request-id",
  "x-correlation-id",
  "x-trace-id",
  "date",
  "expires",
  "if-modified-since",
  "if-none-match",
];

function isSensitive(name) {
  return SENSITIVE_NAMES.indexOf(name.toLowerCase()) !== -1;
}

function condition(paramType, paramName, paramValue) {
  return {
    paramType,
    operator: paramValue === "" ? "isBlank" : "=",
    paramName,
    paramValue,
  };
}

export function buildConditionDrafts(request) {
  const drafts = [];
  if (!request) {
    return drafts;
  }

  if (request.path) {
    drafts.push({
      key: "path",
      label: "Request path",
      selected: true,
      sensitive: false,
      condition: {
        paramType: "uri",
        operator: "match",
        paramName: "/",
        paramValue: request.path,
      },
    });
  }

  if (request.method) {
    drafts.push({
      key: "method",
      label: "HTTP method",
      selected: true,
      sensitive: false,
      condition: condition("req_method", "/", request.method),
    });
  }

  if (request.host) {
    drafts.push({
      key: "domain",
      label: "Request URI host",
      selected: false,
      sensitive: false,
      condition: condition("domain", "/", request.host),
    });
  }

  (request.headers || []).forEach((header, index) => {
    if (IGNORED_HEADERS.indexOf(header.name.toLowerCase()) !== -1) {
      return;
    }
    drafts.push({
      key: `header:${index}`,
      label: `Header ${header.name}`,
      selected: false,
      sensitive: isSensitive(header.name),
      condition: condition("header", header.name, header.value),
    });
  });

  (request.query || []).forEach((item, index) => {
    drafts.push({
      key: `query:${index}`,
      label: `Query ${item.name || "(blank)"}`,
      selected: false,
      sensitive: isSensitive(item.name),
      condition: condition("query", item.name, item.value),
    });
  });

  (request.cookies || []).forEach((item, index) => {
    drafts.push({
      key: `cookie:${index}`,
      label: `Cookie ${item.name || "(blank)"}`,
      selected: false,
      sensitive: true,
      condition: condition("cookie", item.name, item.value),
    });
  });

  return dedupe(drafts);
}

function dedupe(drafts) {
  const seen = {};
  return drafts.filter((item) => {
    const { paramType, operator, paramName, paramValue } = item.condition;
    const signature = [paramType, operator, paramName, paramValue].join(
      "\u0000",
    );
    if (seen[signature]) {
      return false;
    }
    seen[signature] = true;
    return true;
  });
}

export function toConditions(drafts, keys) {
  return (drafts || [])
    .filter((item) => keys.indexOf(item.key) !== -1)
    .map((item) => item.condition);
}

export const FIXED_PARAM_TYPES = ["uri", "host", "ip", "req_method", "domain"];

// A single untouched default condition carries no routing decision, so an
// import replaces it instead of adding an incomplete row next to it.
export function mergeConditions(existing, additions) {
  const current = existing || [];
  const untouched =
    current.length === 1 &&
    current[0].paramType === "uri" &&
    current[0].operator === "pathPattern" &&
    current[0].paramName === "/" &&
    !current[0].paramValue;
  return (untouched ? [] : current).concat(additions || []);
}
