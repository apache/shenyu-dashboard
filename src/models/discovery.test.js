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

import model from "./discovery";

jest.mock("../services/api", () => ({
  addProxySelector: jest.fn(),
  bindingSelector: jest.fn(),
  deleteDiscovery: jest.fn(),
  deleteProxySelector: jest.fn(),
  fetchProxySelector: jest.fn(),
  getDiscovery: jest.fn(),
  getDiscoveryTypeEnums: jest.fn(),
  postDiscoveryInsertOrUpdate: jest.fn(),
  refreshProxySelector: jest.fn(),
  updateDiscoveryUpstream: jest.fn(),
  updateProxySelector: jest.fn(),
}));
jest.mock("../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
}));

const put = (action) => ({ type: "put", action });

it("preserves namespaceId when reloading proxy selectors", () => {
  const fetchValue = {
    name: "tcp-demo",
    currentPage: 2,
    pageSize: 20,
    namespaceId: "namespace-1",
  };
  const generator = model.effects.reload({ fetchValue }, { put });

  expect(generator.next().value).toEqual(
    put({
      type: "fetchProxySelectors",
      payload: fetchValue,
    }),
  );
  expect(generator.next().done).toBe(true);
});
