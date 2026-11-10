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

// Parses request samples into a normalized request model for the selector and
// rule condition editors. Parsing is pure: no shell, filesystem, network or
// environment access.

export const MAX_SAMPLE_LENGTH = 64 * 1024;

const NOOP_FLAGS = [
  "-s",
  "--silent",
  "-S",
  "--show-error",
  "-k",
  "--insecure",
  "-L",
  "--location",
  "--compressed",
  "-v",
  "--verbose",
  "-g",
  "--globoff",
  "--http1.1",
  "--http2",
  "--http2-prior-knowledge",
  "--no-progress-meter",
];

const UNSUPPORTED_FLAGS = {
  "-G": ["GET_AS_QUERY", "Sending data as query parameters is not supported"],
  "--get": [
    "GET_AS_QUERY",
    "Sending data as query parameters is not supported",
  ],
  "-I": ["HEAD_REQUEST", "HEAD requests are not supported"],
  "--head": ["HEAD_REQUEST", "HEAD requests are not supported"],
  "-F": ["MULTIPART_BODY", "Multipart form bodies are not supported"],
  "--form": ["MULTIPART_BODY", "Multipart form bodies are not supported"],
  "-T": ["UPLOAD_BODY", "Uploading a local file is not supported"],
  "--upload-file": ["UPLOAD_BODY", "Uploading a local file is not supported"],
  "-o": ["OUTPUT_FILE", "Writing the response to a file is not supported"],
  "--output": [
    "OUTPUT_FILE",
    "Writing the response to a file is not supported",
  ],
  "-O": ["OUTPUT_FILE", "Writing the response to a file is not supported"],
  "--remote-name": [
    "OUTPUT_FILE",
    "Writing the response to a file is not supported",
  ],
  "-x": ["PROXY", "Proxy options are not supported"],
  "--proxy": ["PROXY", "Proxy options are not supported"],
  "-c": ["COOKIE_JAR", "A cookie jar file is not supported"],
  "--cookie-jar": ["COOKIE_JAR", "A cookie jar file is not supported"],
  "-u": ["USER_CREDENTIALS", "Authorization credentials are not supported"],
  "--user": ["USER_CREDENTIALS", "Authorization credentials are not supported"],
  "--data-urlencode": [
    "DATA_URLENCODE",
    "URL-encoded data options are not supported",
  ],
};

const VALUE_FLAGS = {
  "--url": "url",
  "-X": "method",
  "--request": "method",
  "-H": "header",
  "--header": "header",
  "-b": "cookie",
  "--cookie": "cookie",
  "-d": "data",
  "--data": "data",
  "--data-raw": "data",
  "--data-ascii": "data",
  "--data-binary": "data",
};

function createModel(format) {
  return {
    format,
    ok: true,
    method: "GET",
    path: "",
    host: "",
    scheme: "",
    query: [],
    headers: [],
    cookies: [],
    hostOverride: "",
    body: "",
    issues: [],
  };
}

function addIssue(model, code, message) {
  const exists = model.issues.some(
    (item) => item.code === code && item.message === message,
  );
  if (!exists) {
    model.issues.push({ code, message });
  }
  model.ok = false;
}

function decodeComponent(value) {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch (e) {
    return value;
  }
}

function parseQuery(search) {
  if (!search) {
    return [];
  }
  return search.split("&").map((pair) => {
    const index = pair.indexOf("=");
    if (index === -1) {
      return { name: decodeComponent(pair), value: "" };
    }
    return {
      name: decodeComponent(pair.slice(0, index)),
      value: decodeComponent(pair.slice(index + 1)),
    };
  });
}

function parseCookieString(value) {
  return value
    .split(";")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => {
      const index = item.indexOf("=");
      return {
        name: index === -1 ? item : item.slice(0, index),
        value: index === -1 ? "" : item.slice(index + 1),
      };
    });
}

function parseHeaderLine(line) {
  const index = line.indexOf(":");
  if (index === -1) {
    return null;
  }
  return {
    name: line.slice(0, index).trim(),
    value: line.slice(index + 1).trim(),
  };
}

function tokenizeCurl(input, model) {
  const tokens = [];
  let current = "";
  let hasToken = false;
  let quote = null;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quote === "'") {
      if (char === "'") {
        quote = null;
      } else {
        current += char;
      }
    } else if (quote === '"') {
      if (char === '"') {
        quote = null;
      } else if (char === "\\") {
        i += 1;
        current += input[i] || "";
      } else {
        if (char === "$" || char === "`") {
          addIssue(
            model,
            "SHELL_EXPANSION",
            "Shell expansion is not performed; the value is kept literally",
          );
        }
        current += char;
      }
    } else if (char === "'" || char === '"') {
      quote = char;
      hasToken = true;
    } else if (char === "\\") {
      const next = input[i + 1];
      if (next === "\n") {
        i += 1;
      } else if (next === "\r" && input[i + 2] === "\n") {
        i += 2;
      } else {
        hasToken = true;
        i += 1;
        current += input[i] || "";
      }
    } else if (/\s/.test(char)) {
      if (hasToken) {
        tokens.push(current);
        current = "";
        hasToken = false;
      }
    } else {
      if (char === "$" || char === "`") {
        addIssue(
          model,
          "SHELL_EXPANSION",
          "Shell expansion is not performed; the value is kept literally",
        );
      }
      current += char;
      hasToken = true;
    }
  }

  if (quote) {
    addIssue(model, "UNCLOSED_QUOTE", "A quoted argument is not closed");
  }
  if (hasToken) {
    tokens.push(current);
  }
  return tokens;
}

function splitFlag(token) {
  const index = token.indexOf("=");
  if (token.slice(0, 2) === "--" && index !== -1) {
    return [token.slice(0, index), token.slice(index + 1)];
  }
  return [token, null];
}

function readOptions(tokens, model) {
  const options = {
    url: "",
    method: "",
    headers: [],
    cookies: [],
    data: "",
    hasData: false,
  };
  let index = 0;

  while (index < tokens.length) {
    const token = tokens[index];
    const [flag, inlineValue] = splitFlag(token);

    if (token === "curl") {
      index += 1;
    } else if (token.slice(0, 1) === "-" && token !== "-") {
      if (UNSUPPORTED_FLAGS[flag]) {
        addIssue(model, UNSUPPORTED_FLAGS[flag][0], UNSUPPORTED_FLAGS[flag][1]);
        index += 1;
      } else if (VALUE_FLAGS[flag]) {
        let value = inlineValue;
        if (value === null) {
          index += 1;
          value = index < tokens.length ? tokens[index] : null;
        }
        if (value === null || value === undefined) {
          addIssue(model, "MISSING_VALUE", `Option ${flag} has no value`);
        } else if (
          value.charAt(0) === "@" &&
          (VALUE_FLAGS[flag] === "data" || VALUE_FLAGS[flag] === "cookie")
        ) {
          addIssue(model, "FILE_READ", `Option ${flag} reads a local file`);
        } else {
          storeOption(options, VALUE_FLAGS[flag], value);
        }
        index += 1;
      } else if (NOOP_FLAGS.indexOf(flag) !== -1) {
        index += 1;
      } else if (
        flag.slice(0, 2) !== "--" &&
        flag.length > 2 &&
        flag
          .slice(1)
          .split("")
          .every((item) => NOOP_FLAGS.indexOf(`-${item}`) !== -1)
      ) {
        index += 1;
      } else {
        addIssue(model, "UNKNOWN_OPTION", `Option ${flag} is not supported`);
        index += 1;
      }
    } else if (!options.url) {
      options.url = token;
      index += 1;
    } else {
      addIssue(
        model,
        "MULTIPLE_URLS",
        "Only one request URL can be imported at a time",
      );
      index += 1;
    }
  }

  return options;
}

function storeOption(options, kind, value) {
  if (kind === "url") {
    options.url = value;
  } else if (kind === "method") {
    options.method = value;
  } else if (kind === "header") {
    options.headers.push(value);
  } else if (kind === "cookie") {
    options.cookies.push(value);
  } else if (kind === "data") {
    options.data = options.hasData ? `${options.data}&${value}` : value;
    options.hasData = true;
  }
}

function setMethod(model, value) {
  const method = String(value || "").toUpperCase();
  if (!/^[A-Z][A-Z-]*$/.test(method)) {
    addIssue(model, "INVALID_METHOD", `HTTP method "${value}" is not valid`);
    return;
  }
  model.method = method;
}

function applyUrl(model, rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (e) {
    addIssue(model, "INVALID_URL", "The request URL cannot be parsed");
    return;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    addIssue(
      model,
      "UNSUPPORTED_SCHEME",
      `Scheme ${parsed.protocol} is not HTTP`,
    );
    return;
  }
  model.scheme = parsed.protocol.replace(":", "");
  model.host = parsed.hostname;
  model.path = parsed.pathname || "/";
  const hashIndex = rawUrl.indexOf("#");
  const searchIndex = rawUrl.indexOf("?");
  if (searchIndex !== -1 && (hashIndex === -1 || searchIndex < hashIndex)) {
    const end = hashIndex === -1 ? rawUrl.length : hashIndex;
    model.query = parseQuery(rawUrl.slice(searchIndex + 1, end));
  }
}

function applyHeader(model, header) {
  model.headers.push(header);
  const name = header.name.toLowerCase();
  if (name === "host") {
    model.hostOverride = header.value;
  }
  if (name === "cookie") {
    model.cookies = model.cookies.concat(parseCookieString(header.value));
  }
}

function applyHeaders(model, headers) {
  headers.forEach((line) => {
    const header = parseHeaderLine(line);
    if (!header) {
      addIssue(model, "INVALID_HEADER", `Header "${line}" has no name`);
      return;
    }
    applyHeader(model, header);
  });
}

function guardInput(input, model) {
  if (typeof input !== "string") {
    addIssue(model, "INVALID_INPUT", "The request sample must be a string");
    return false;
  }
  if (input.length > MAX_SAMPLE_LENGTH) {
    addIssue(
      model,
      "TOO_LARGE",
      `The request sample exceeds ${MAX_SAMPLE_LENGTH} characters`,
    );
    return false;
  }
  if (!input.trim()) {
    addIssue(model, "EMPTY_INPUT", "The request sample is empty");
    return false;
  }
  return true;
}

export function parseCurl(input) {
  const model = createModel("curl");
  if (!guardInput(input, model)) {
    return model;
  }
  const tokens = tokenizeCurl(input, model);
  const options = readOptions(tokens, model);

  if (!options.url) {
    addIssue(model, "MISSING_URL", "No request URL was found");
    return model;
  }

  applyUrl(model, options.url);
  applyHeaders(model, options.headers);
  options.cookies.forEach((value) => {
    if (value.charAt(0) === "@") {
      addIssue(model, "FILE_READ", "Reading a cookie file is not supported");
      return;
    }
    model.cookies = model.cookies.concat(parseCookieString(value));
  });

  if (options.method) {
    setMethod(model, options.method);
  } else {
    setMethod(model, options.hasData ? "POST" : "GET");
  }
  model.body = options.data;

  if (model.hostOverride && model.hostOverride !== model.host) {
    addIssue(
      model,
      "HOST_OVERRIDE",
      "The Host header differs from the request URL host",
    );
  }
  return model;
}

function splitRawRequest(input) {
  const normalized = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const boundary = normalized.indexOf("\n\n");
  const head = boundary === -1 ? normalized : normalized.slice(0, boundary);
  const body = boundary === -1 ? "" : normalized.slice(boundary + 2);
  return { lines: head.split("\n"), body };
}

export function parseRawHttp(input) {
  const model = createModel("http");
  if (!guardInput(input, model)) {
    return model;
  }
  const { lines, body } = splitRawRequest(input);
  const requestLine = (lines.shift() || "").trim().split(/\s+/);

  if (requestLine.length < 2) {
    addIssue(
      model,
      "INVALID_REQUEST_LINE",
      "The request line must contain a method and a target",
    );
    return model;
  }

  setMethod(model, requestLine[0]);
  const target = requestLine[1];
  model.body = body;

  if (/^https?:\/\//i.test(target)) {
    applyUrl(model, target);
  } else if (target.charAt(0) === "/") {
    const queryIndex = target.indexOf("?");
    model.path = queryIndex === -1 ? target : target.slice(0, queryIndex);
    if (queryIndex !== -1) {
      model.query = parseQuery(target.slice(queryIndex + 1));
    }
  } else {
    addIssue(
      model,
      "RELATIVE_TARGET",
      "Only absolute or origin-form request targets are supported",
    );
    return model;
  }

  lines.forEach((line) => {
    if (!line.trim()) {
      return;
    }
    const header = parseHeaderLine(line);
    if (!header) {
      addIssue(model, "INVALID_HEADER", `Header "${line}" has no name`);
      return;
    }
    applyHeader(model, header);
  });

  if (!model.host) {
    if (model.hostOverride) {
      model.host = model.hostOverride;
    } else {
      addIssue(model, "MISSING_HOST", "No Host header was found");
    }
  }
  if (model.hostOverride && model.hostOverride !== model.host) {
    addIssue(
      model,
      "HOST_OVERRIDE",
      "The Host header differs from the request URL host",
    );
  }
  return model;
}

export function parseRequestSample(input) {
  const trimmed = typeof input === "string" ? input.replace(/^\s+/, "") : "";
  if (/^curl(\s|$)/i.test(trimmed)) {
    return parseCurl(trimmed);
  }
  return parseRawHttp(input);
}
