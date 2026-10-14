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

import fetch from "dva/fetch";
import { notification } from "antd";
import store from "../index";
import { getIntlContent } from "./IntlUtils";

const getCodeMessage = (status) => {
  const codeMessage = {
    200: getIntlContent("SHENYU.REQUEST.STATUS.200"),
    201: getIntlContent("SHENYU.REQUEST.STATUS.201"),
    202: getIntlContent("SHENYU.REQUEST.STATUS.202"),
    204: getIntlContent("SHENYU.REQUEST.STATUS.204"),
    400: getIntlContent("SHENYU.REQUEST.STATUS.400"),
    401: getIntlContent("SHENYU.REQUEST.STATUS.401"),
    403: getIntlContent("SHENYU.REQUEST.STATUS.403"),
    404: getIntlContent("SHENYU.REQUEST.STATUS.404"),
    406: getIntlContent("SHENYU.REQUEST.STATUS.406"),
    410: getIntlContent("SHENYU.REQUEST.STATUS.410"),
    422: getIntlContent("SHENYU.REQUEST.STATUS.422"),
    500: getIntlContent("SHENYU.REQUEST.STATUS.500"),
    502: getIntlContent("SHENYU.REQUEST.STATUS.502"),
    503: getIntlContent("SHENYU.REQUEST.STATUS.503"),
    504: getIntlContent("SHENYU.REQUEST.STATUS.504"),
  };
  return codeMessage[status];
};

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const errortext = getCodeMessage(response.status) || response.statusText;
  notification.error({
    message: `${getIntlContent("SHENYU.REQUEST.ERROR")} ${response.status}: ${response.url}`,
    description: errortext,
  });
  const error = new Error(errortext);
  error.name = response.status;
  error.response = response;
  throw error;
}

/**
 * check response's code
 * @param {response} response
 */
const checkResponseCode = (response) => {
  if (response.code === 401) {
    notification.error({
      message: getIntlContent("SHENYU.MESSAGE.SESSION.INVALID"),
      description: getIntlContent("SHENYU.MESSAGE.SESSION.RELOGIN"),
    });
    const error = new Error(response.message);
    error.name = response.code;
    error.response = response;
    throw error;
  } else {
    return true;
  }
};

export const handleUnauthorized = () => {
  const { dispatch } = store;
  dispatch({
    type: "login/logout",
  });
  dispatch({
    type: "global/resetPermission",
  });
};

/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 * @return {Promise}          The API payload, or null for HTTP 204. Rejects on
 *                            HTTP, authentication, network, or JSON errors.
 */
export default function request(url, options) {
  const defaultOptions = {};
  const newOptions = { ...defaultOptions, ...options };
  if (
    newOptions.method === "POST" ||
    newOptions.method === "PUT" ||
    newOptions.method === "DELETE"
  ) {
    if (!(newOptions.body instanceof FormData)) {
      newOptions.headers = {
        Accept: "application/json",
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json; charset=utf-8",
        ...newOptions.headers,
      };
      newOptions.body = JSON.stringify(newOptions.body);
    } else {
      // newOptions.body is FormData
      newOptions.headers = {
        Accept: "application/json",
        ...newOptions.headers,
      };
    }
  }

  // add token
  let token = window.sessionStorage.getItem("token");
  if (token) {
    if (!newOptions.headers) {
      newOptions.headers = {};
    }
    newOptions.headers = { ...newOptions.headers, "X-Access-Token": token };
  }

  return fetch(url, newOptions)
    .then(checkStatus)
    .then((response) => {
      if (response.status === 204) {
        return null;
      }
      return response.json();
    })
    .then((res) => {
      if (res === null || checkResponseCode(res)) {
        return res;
      }
    })
    .catch((e) => {
      const status = e.name;
      if (status === 401) {
        handleUnauthorized();
      }
      throw e;
    });
}
