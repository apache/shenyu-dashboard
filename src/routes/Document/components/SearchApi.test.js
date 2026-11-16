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
import { act, render, waitFor } from "@testing-library/react";
import { Tree } from "antd";
import { getRootTag, getParentTagId, getApi } from "../../../services/api";
import SearchApi from "./SearchApi";

jest.mock("antd", () => ({
  Tree: jest.fn(() => null),
  Empty: () => null,
  Typography: { Text: () => null },
  Button: () => null,
  Row: () => null,
  Col: () => null,
  Spin: ({ children }) => children,
  Tooltip: () => null,
}));
jest.mock("../../../components/ui/feedback", () => ({
  message: { error: jest.fn() },
}));
jest.mock("../../../services/api", () => ({
  getRootTag: jest.fn(),
  getParentTagId: jest.fn(),
  getApi: jest.fn(),
}));
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock("./AddAndUpdateTag", () => () => null);
jest.mock("./AddAndUpdateApiDoc", () => () => null);
jest.mock("./ImportSwaggerModal", () => () => null);

const treeProps = () => Tree.mock.calls[Tree.mock.calls.length - 1][0];

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

  render(<SearchApi onSelect={jest.fn()} afterUpdate={jest.fn()} />);
  await waitFor(() => expect(Tree).toHaveBeenCalled());

  const expand = async (node) => {
    await act(async () => {
      await treeProps().onExpand([node.key], {
        expanded: true,
        node: { props: { ...node, eventKey: node.key } },
      });
    });
  };

  await expand(treeProps().treeData[0]);
  const child = treeProps().treeData[0].children[0];
  expect(child.key).toBe("0-tag-0");

  await expand(child);
  const grandchild = treeProps().treeData[0].children[0].children[0];
  expect(grandchild.key).toBe("0-tag-0-tag-0");

  await expand(grandchild);
  const root = treeProps().treeData[0];
  expect(root.children[1].id).toBe("root-api");
  expect(root.children[0].children[1].id).toBe("child-api");
  expect(root.children[0].children[0].children[0].id).toBe("grandchild-api");
  expect(getParentTagId.mock.calls).toEqual([["root"], ["child"]]);
  expect(getApi.mock.calls).toEqual([["root"], ["child"], ["grandchild"]]);
});
