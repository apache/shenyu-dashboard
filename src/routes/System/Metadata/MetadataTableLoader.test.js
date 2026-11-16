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
import { fireEvent, render, screen } from "@testing-library/react";
import MetadataTableLoader, { TableLoading } from "./MetadataTableLoader";
import loadMetadataTable from "./loadMetadataTable";

jest.mock("./loadMetadataTable");
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));

it("announces that the table is loading", () => {
  render(<TableLoading />);
  expect(screen.getByRole("status").getAttribute("aria-label")).toBe(
    "SHENYU.META.TABLE.LOADING",
  );
});

it("recovers a failed module download and forwards the controlled table props", async () => {
  const Table = jest.fn(() => <div>Loaded metadata table</div>);
  loadMetadataTable.mockRejectedValueOnce(new Error("Chunk unavailable"));
  loadMetadataTable.mockResolvedValueOnce({ __esModule: true, default: Table });
  const props = { currentPage: 3, pageSize: 20, total: 88 };
  render(<MetadataTableLoader {...props} />);
  await screen.findByRole("alert");
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.META.EDITOR.RETRY" }),
  );
  await screen.findByText("Loaded metadata table");
  expect(loadMetadataTable).toHaveBeenCalledTimes(2);
  expect(Table.mock.calls[0][0]).toEqual(props);
});
