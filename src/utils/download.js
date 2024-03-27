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

/**
 * Requests a URL, for downloading.
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
export default async function download(url, options) {
  const defaultOptions = {
    method: "GET",
  };

  const newOptions = { ...defaultOptions, ...options };

  // add token
  let token = window.sessionStorage.getItem("token");
  if (token) {
    if (!newOptions.headers) {
      newOptions.headers = {};
    }
    newOptions.headers = { ...newOptions.headers, "X-Access-Token": token };
  }
  try {
    const response = await fetch(url, newOptions);
    const disposition = response.headers.get("Content-Disposition");
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    let filename = "download";
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, "");
    }

    const blob = await response.blob();

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); // use blob obj to create URL
    a.download = filename; // use the file name from backend
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    throw new Error(`下载文件失败：${error}`);
  }
}
