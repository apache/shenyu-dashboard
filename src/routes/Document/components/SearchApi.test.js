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
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  getRootTag,
  getParentTagId,
  getApi,
  addTag,
} from "../../../services/api";
import SearchApi from "./SearchApi";

jest.mock("../../../components/ui/feedback", () => ({
  message: { error: jest.fn(), success: jest.fn() },
}));
jest.mock("../../../services/api", () => ({
  getRootTag: jest.fn(),
  getParentTagId: jest.fn(),
  getApi: jest.fn(),
  addTag: jest.fn(),
}));
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock("./AddAndUpdateApiDoc", () => () => null);
jest.mock("./ImportSwaggerModal", () => () => null);

it("expands nested modules with generated tag keys while retaining direct APIs", async () => {
  getRootTag.mockResolvedValue({
    code: 200,
    data: [{ id: "root", name: "Root", hasChildren: true }],
  });
  getParentTagId.mockImplementation(async (id) => ({
    code: 200,
    data:
      id === "root"
        ? [{ id: "child", name: "Child", hasChildren: true }]
        : [{ id: "grandchild", name: "Grandchild", hasChildren: false }],
  }));
  getApi.mockImplementation(async (id) => ({
    code: 200,
    data: { dataList: [{ id: `${id}-api`, apiPath: `/${id}`, httpMethod: 0 }] },
  }));

  const onSelect = jest.fn();
  const afterUpdate = jest.fn();
  const ref = React.createRef();
  render(<SearchApi ref={ref} onSelect={onSelect} afterUpdate={afterUpdate} />);
  await screen.findByText("Root");

  const expand = async (name) => {
    const node = screen.getByText(name).closest('[role="treeitem"]');
    fireEvent.click(within(node).getByRole("button"));
  };

  await expand("Root");
  await waitFor(() => expect(getParentTagId).toHaveBeenCalledWith("root"));
  await screen.findByText("Child");
  expect(screen.getByText("/root")).not.toBeNull();
  await expand("Child");
  await screen.findByText("Grandchild");
  expect(screen.getByText("/child")).not.toBeNull();
  await expand("Grandchild");
  await screen.findByText("/grandchild");
  expect(getParentTagId.mock.calls).toEqual([["root"], ["child"]]);
  expect(getApi.mock.calls).toEqual([["root"], ["child"], ["grandchild"]]);

  fireEvent.click(screen.getByText("/grandchild"));
  expect(onSelect).toHaveBeenLastCalledWith(["0-tag-0-tag-0-api-0"], {
    node: {
      props: expect.objectContaining({ id: "grandchild-api", isLeaf: true }),
    },
  });

  act(() =>
    ref.current.updateTree(
      { id: "grandchild-api", apiPath: "/updated", httpMethod: 2 },
      "api",
    ),
  );
  await screen.findByText("/updated");
  expect(screen.queryByText("/grandchild")).toBeNull();
  await waitFor(() =>
    expect(afterUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "grandchild-api" }),
      "api",
    ),
  );
});

it("opens the retained tag form and creates a root module", async () => {
  getRootTag.mockResolvedValue({ code: 200, data: [] });
  addTag.mockResolvedValue({ code: 200, message: "created" });
  render(<SearchApi onSelect={jest.fn()} afterUpdate={jest.fn()} />);
  await waitFor(() => expect(getRootTag).toHaveBeenCalled());
  fireEvent.click(
    screen.getByText("SHENYU.DOCUMENT.APIDOC.SEARCH.ADD_ROOT_MODULE"),
  );
  fireEvent.change(await screen.findByLabelText("SHENYU.DOCUMENT.TAG.NAME"), {
    target: { value: "New project" },
  });
  fireEvent.change(screen.getByLabelText("SHENYU.DOCUMENT.TAG.DESC"), {
    target: { value: "Description" },
  });
  const dialog = screen.getByRole("dialog");
  fireEvent.click(
    within(dialog).getByRole("button", { name: "SHENYU.COMMON.SURE" }),
  );
  await waitFor(() =>
    expect(addTag).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "New project",
        tagDesc: "Description",
        parentTagId: "0",
      }),
    ),
  );
});
