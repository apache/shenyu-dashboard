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

import { buildConditionDrafts, toConditions } from "./conditionDraft";

const request = {
  method: "GET",
  path: "/orders/123",
  host: "api.example.com",
  query: [{ name: "tenant", value: "gray" }],
  headers: [{ name: "X-Version", value: "v2" }],
  cookies: [],
};

it("selects only exact path and method by default", () => {
  const drafts = buildConditionDrafts(request);
  expect(
    drafts.filter((item) => item.selected).map((item) => item.key),
  ).toEqual(["path", "method"]);
});

it("uses the legacy condition shape and exact path operator", () => {
  const drafts = buildConditionDrafts(request);
  expect(drafts[0].condition).toEqual({
    paramType: "uri",
    operator: "match",
    paramName: "/",
    paramValue: "/orders/123",
  });
  expect(drafts[1].condition).toEqual({
    paramType: "req_method",
    operator: "=",
    paramName: "/",
    paramValue: "GET",
  });
});

it("offers host, header and query as unselected drafts", () => {
  const drafts = buildConditionDrafts(request);
  const domain = drafts.find((item) => item.key === "domain");
  const header = drafts.find((item) => item.key === "header:0");
  const query = drafts.find((item) => item.key === "query:0");
  expect(domain.condition.paramType).toBe("domain");
  expect(header.condition).toEqual({
    paramType: "header",
    operator: "=",
    paramName: "X-Version",
    paramValue: "v2",
  });
  expect(query.condition).toEqual({
    paramType: "query",
    operator: "=",
    paramName: "tenant",
    paramValue: "gray",
  });
  expect([domain.selected, header.selected, query.selected]).toEqual([
    false,
    false,
    false,
  ]);
});

it("marks credentials and identifiers as sensitive without preselecting them", () => {
  const drafts = buildConditionDrafts({
    ...request,
    headers: [
      { name: "Authorization", value: "Bearer token" },
      { name: "X-Request-Id", value: "abc" },
      { name: "X-Tenant", value: "acme" },
    ],
    cookies: [{ name: "session", value: "s1" }],
  });
  const byName = (name) =>
    drafts.find((item) => item.label === `Header ${name}`);
  expect(byName("Authorization").sensitive).toBe(true);
  expect(byName("X-Request-Id").sensitive).toBe(true);
  expect(byName("X-Tenant").sensitive).toBe(false);
  expect(drafts.find((item) => item.key === "cookie:0").sensitive).toBe(true);
  expect(drafts.filter((item) => item.selected)).toHaveLength(2);
});

it("ignores headers that are not routing conditions", () => {
  const drafts = buildConditionDrafts({
    ...request,
    headers: [
      { name: "Host", value: "api.example.com" },
      { name: "Content-Type", value: "application/json" },
      { name: "Accept", value: "*/*" },
      { name: "User-Agent", value: "curl/8" },
    ],
  });
  expect(drafts.filter((item) => item.key.indexOf("header:") === 0)).toEqual(
    [],
  );
});

it("uses isBlank for a condition without a value", () => {
  const drafts = buildConditionDrafts({
    ...request,
    headers: [{ name: "X-Empty", value: "" }],
  });
  const header = drafts.find((item) => item.key === "header:0");
  expect(header.condition.operator).toBe("isBlank");
  expect(header.condition.paramValue).toBe("");
});

it("keeps the raw encoded path instead of translating it", () => {
  const drafts = buildConditionDrafts({ ...request, path: "/a%2Fb" });
  expect(drafts[0].condition.paramValue).toBe("/a%2Fb");
});

it("drops redundant conditions but keeps distinct repeated query values", () => {
  const drafts = buildConditionDrafts({
    ...request,
    headers: [
      { name: "X-A", value: "1" },
      { name: "X-A", value: "1" },
    ],
    query: [
      { name: "id", value: "1" },
      { name: "id", value: "1" },
      { name: "id", value: "2" },
    ],
  });
  const headers = drafts.filter((item) => item.key.indexOf("header:") === 0);
  const queries = drafts.filter((item) => item.key.indexOf("query:") === 0);
  expect(headers).toHaveLength(1);
  expect(queries.map((item) => item.condition.paramValue)).toEqual(["1", "2"]);
});

it("returns an empty draft for a missing request", () => {
  expect(buildConditionDrafts(null)).toEqual([]);
});

it("converts only the selected keys", () => {
  const drafts = buildConditionDrafts(request);
  const draft = (key) => drafts.find((item) => item.key === key);
  expect(toConditions(drafts, ["path", "query:0"])).toEqual([
    draft("path").condition,
    draft("query:0").condition,
  ]);
  expect(toConditions(drafts, [])).toEqual([]);
});
