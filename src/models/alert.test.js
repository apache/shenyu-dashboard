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

import model from "./alert";

jest.mock("../services/api", () => ({
  addAlertReceiver: jest.fn(),
  deleteAlertReceivers: jest.fn(),
  fetchAlertReport: jest.fn(),
  getAlertReceiverDetail: jest.fn(),
  getAlertReceivers: jest.fn(),
  updateAlertReceiver: jest.fn(),
}));
jest.mock("../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
}));

const put = (action) => ({ type: "put", action });

it("reloads alert receivers with the active namespace", () => {
  const fetchValue = {
    currentPage: 2,
    pageSize: 20,
    namespaceId: "namespace-1",
  };
  const generator = model.effects.reload({ fetchValue }, { put });

  expect(generator.next().value).toEqual(
    put({
      type: "fetch",
      payload: fetchValue,
    }),
  );
  expect(generator.next().done).toBe(true);
});
