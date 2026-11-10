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

import {
  MAX_SAMPLE_LENGTH,
  parseCurl,
  parseRawHttp,
  parseRequestSample,
} from "./requestSample";

const codes = (model) => model.issues.map((issue) => issue.code);

it("extracts the example request from the issue", () => {
  const model = parseCurl(
    `curl 'https://api.example.com/orders/123?tenant=gray' \\
      -H 'X-Version: v2'`,
  );
  expect(model.ok).toBe(true);
  expect(model.method).toBe("GET");
  expect(model.path).toBe("/orders/123");
  expect(model.host).toBe("api.example.com");
  expect(model.query).toEqual([{ name: "tenant", value: "gray" }]);
  expect(model.headers).toEqual([{ name: "X-Version", value: "v2" }]);
});

it("keeps quoted spaces and escaped quotes in header values", () => {
  const model = parseCurl(
    `curl "https://api.example.com/a" -H "X-Note: hello world \\"quoted\\""`,
  );
  expect(model.headers).toEqual([
    { name: "X-Note", value: 'hello world "quoted"' },
  ]);
});

it("treats a single-quoted dollar sign as literal", () => {
  const model = parseCurl("curl 'https://api.example.com/a' -H 'X-Key: a$b'");
  expect(model.ok).toBe(true);
  expect(model.headers[0].value).toBe("a$b");
});

it("treats the method as GET by default and POST when inline data is present", () => {
  expect(parseCurl("curl https://api.example.com/a").method).toBe("GET");
  expect(
    parseCurl("curl https://api.example.com/a -d '{\"a\":1}'").method,
  ).toBe("POST");
});

it("lets an explicit method override the inline data default", () => {
  const model = parseCurl("curl https://api.example.com/a -d x -X put");
  expect(model.method).toBe("PUT");
  expect(model.body).toBe("x");
});

it("preserves percent-encoded and UTF-8 paths without decoding them", () => {
  const escaped = parseCurl("curl 'https://api.example.com/a%2Fb'");
  expect(escaped.path).toBe("/a%2Fb");
  const utf8 = parseCurl("curl 'https://api.example.com/caf%C3%A9'");
  expect(utf8.path).toBe("/caf%C3%A9");
});

it("preserves repeated and blank query fields and decodes values", () => {
  const model = parseCurl(
    "curl 'https://api.example.com/a?id=1&id=&q=hello+world&id=2'",
  );
  expect(model.query).toEqual([
    { name: "id", value: "1" },
    { name: "id", value: "" },
    { name: "q", value: "hello world" },
    { name: "id", value: "2" },
  ]);
});

it("keeps repeated headers and cookies", () => {
  const model = parseCurl(
    "curl https://api.example.com/a -H 'X-A: 1' -H 'X-A: 2' -b 'a=1; b=2'",
  );
  expect(model.headers).toEqual([
    { name: "X-A", value: "1" },
    { name: "X-A", value: "2" },
  ]);
  expect(model.cookies).toEqual([
    { name: "a", value: "1" },
    { name: "b", value: "2" },
  ]);
});

it("reports a Host header that differs from the URL host", () => {
  const model = parseCurl(
    "curl https://api.example.com/a -H 'Host: internal.example.com'",
  );
  expect(model.host).toBe("api.example.com");
  expect(model.hostOverride).toBe("internal.example.com");
  expect(codes(model)).toContain("HOST_OVERRIDE");
  expect(model.ok).toBe(false);
});

it.each([
  ["-G", "GET_AS_QUERY"],
  ["-I", "HEAD_REQUEST"],
  ["-F 'a=b'", "MULTIPART_BODY"],
  ["--data-binary @payload.json", "FILE_READ"],
  ["-b @cookies.txt", "FILE_READ"],
  ["--unknown-flag", "UNKNOWN_OPTION"],
])("reports unsupported curl syntax %s", (flags, code) => {
  const model = parseCurl(`curl https://api.example.com/a ${flags}`);
  expect(codes(model)).toContain(code);
  expect(model.ok).toBe(false);
});

it("reports shell expansion instead of expanding it", () => {
  const model = parseCurl('curl https://api.example.com/a -H "X-Key: $TOKEN"');
  expect(codes(model)).toContain("SHELL_EXPANSION");
  expect(model.headers[0].value).toBe("$TOKEN");
});

it("reports multiple URLs", () => {
  const model = parseCurl(
    "curl https://api.example.com/a https://api.example.com/b",
  );
  expect(codes(model)).toContain("MULTIPLE_URLS");
});

it("reports an unclosed quote", () => {
  expect(parseCurl("curl 'https://api.example.com/a").issues[0].code).toBe(
    "UNCLOSED_QUOTE",
  );
});

it("rejects non-HTTP URLs", () => {
  expect(parseCurl("curl ftp://api.example.com/a").issues[0].code).toBe(
    "UNSUPPORTED_SCHEME",
  );
});

it("bounds oversized and empty input", () => {
  const oversized = `curl https://api.example.com/${"a".repeat(
    MAX_SAMPLE_LENGTH,
  )}`;
  expect(parseCurl(oversized).issues[0].code).toBe("TOO_LARGE");
  expect(parseCurl("   ").issues[0].code).toBe("EMPTY_INPUT");
  expect(parseCurl(undefined).issues[0].code).toBe("INVALID_INPUT");
});

it("parses a raw HTTP request and keeps the body out of the path", () => {
  const model = parseRawHttp(
    [
      "POST /orders/123?tenant=gray HTTP/1.1",
      "Host: api.example.com",
      "X-Version: v2",
      "Content-Type: application/json",
      "",
      '{"id":123}',
    ].join("\r\n"),
  );
  expect(model.ok).toBe(true);
  expect(model.format).toBe("http");
  expect(model.method).toBe("POST");
  expect(model.path).toBe("/orders/123");
  expect(model.host).toBe("api.example.com");
  expect(model.query).toEqual([{ name: "tenant", value: "gray" }]);
  expect(model.body).toBe('{"id":123}');
});

it("uses the Host header when a raw request target is origin-form", () => {
  const model = parseRawHttp("GET /a HTTP/1.1\r\nHost: api.example.com\r\n");
  expect(model.host).toBe("api.example.com");
  expect(model.ok).toBe(true);
});

it("reports a raw request without a Host header", () => {
  const model = parseRawHttp("GET /a HTTP/1.1\r\nAccept: */*\r\n");
  expect(codes(model)).toContain("MISSING_HOST");
});

it("rejects an unsupported raw request target", () => {
  expect(
    parseRawHttp("CONNECT api.example.com:443 HTTP/1.1").issues[0].code,
  ).toBe("RELATIVE_TARGET");
});

it("detects the sample format", () => {
  expect(parseRequestSample("  curl https://api.example.com/a").format).toBe(
    "curl",
  );
  expect(parseRequestSample("GET /a HTTP/1.1\r\nHost: x\r\n").format).toBe(
    "http",
  );
});

it("never executes the shell, reads files or performs requests", () => {
  const fetchMock = jest.fn();
  global.fetch = fetchMock;
  parseCurl("curl https://api.example.com/a -d @payload.json $(whoami) `id`");
  expect(fetchMock).not.toHaveBeenCalled();
  delete global.fetch;
});

it("does not mutate its input", () => {
  const input = "curl https://api.example.com/a -H 'X-A: 1'";
  const copy = input;
  parseCurl(input);
  expect(input).toBe(copy);
});
