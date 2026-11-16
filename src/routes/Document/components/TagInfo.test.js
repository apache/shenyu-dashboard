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

import React from "react";
import { render, screen } from "@testing-library/react";
import ApiContext from "./ApiContext";
import TagInfo from "./TagInfo";

jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
}));

it("binds the protocol column to rpcType", () => {
  render(
    <ApiContext.Provider
      value={{
        tagDetail: {
          id: "tag-1",
          apiDataList: [{ id: "api-1", rpcType: "http" }],
        },
      }}
    >
      <TagInfo handleUpdate={jest.fn()} handleDelete={jest.fn()} />
    </ApiContext.Provider>,
  );

  expect(screen.getByText("http")).not.toBeNull();
});
