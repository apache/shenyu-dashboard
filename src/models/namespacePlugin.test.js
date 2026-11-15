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

import model from "./namespacePlugin";

jest.mock("../services/api", () => ({ getAllNamespacePlugins: jest.fn() }));
jest.mock("../components/ui/feedback", () => ({ message: {} }));
jest.mock("../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
it.each(["ns-1", "ns-2"])(
  "only saves rows belonging to the active namespace %s",
  (currentNamespaceId) => {
    const payload = { namespaceId: "ns-1", currentPage: 1, pageSize: 12 };
    const response = {
      code: 200,
      data: { page: { totalCount: 1 }, dataList: [{ id: "row-1" }] },
    };
    const put = jest.fn((action) => action);
    const gen = model.effects.fetch(
      { payload },
      {
        call: () => response,
        put,
        select: (read) => read({ global: { currentNamespaceId } }),
      },
    );
    let step = gen.next();
    while (!step.done) step = gen.next(step.value);
    if (currentNamespaceId === payload.namespaceId)
      expect(put).toHaveBeenCalledWith(
        expect.objectContaining({ type: "savePlugins" }),
      );
    else expect(put).not.toHaveBeenCalled();
  },
);
