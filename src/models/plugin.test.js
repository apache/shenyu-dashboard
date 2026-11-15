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

import model from "./plugin";

jest.mock("../services/api", () => ({}));
jest.mock("../components/ui/feedback", () => ({ message: {} }));
jest.mock("../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
it("keeps all template filters when reloading", () => {
  const fetchValue = {
    name: "demo",
    role: "Proxy",
    namespaceId: "ns-1",
    enabled: false,
    currentPage: 2,
    pageSize: 20,
  };
  const put = (action) => action;
  const gen = model.effects.reload({ fetchValue }, { put });
  expect(gen.next().value).toEqual({ type: "fetch", payload: fetchValue });
});
