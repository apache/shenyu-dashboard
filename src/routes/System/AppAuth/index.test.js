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

import ConnectedAuth from "./index";
import model from "../../../models/auth";

jest.mock("./AddModal", () => () => null);
jest.mock("./AddTable", () => () => null);
jest.mock("./RelateMetadata", () => () => null);
jest.mock("./SearchContent", () => () => null);
jest.mock(
  "../../../utils/AuthButton",
  () =>
    ({ children }) =>
      children,
);
jest.mock("../../../utils/IntlUtils", () => ({
  getCurrentLocale: jest.fn(),
  getIntlContent: (key) => key,
}));
jest.mock("../../../services/api", () => ({
  addAuthData: jest.fn(),
  deleteAuths: jest.fn(),
  findAuthData: jest.fn(),
  findAuthDataDel: jest.fn(),
  getAllAuths: jest.fn(),
  getAllMetadata: jest.fn(),
  getAllMetadatas: jest.fn(),
  getfetchMetaGroup: jest.fn(),
  syncAuthsData: jest.fn(),
  updateAuthData: jest.fn(),
  updateAuthDel: jest.fn(),
  updateAuthEnabled: jest.fn(),
  updateAuthOpened: jest.fn(),
}));

const Auth = ConnectedAuth.WrappedComponent;
const put = (action) => ({ type: "put", action });

const makeComponent = (dispatch) => {
  const component = new Auth({
    currentNamespaceId: "namespace-1",
    dispatch,
  });
  component.setState = (update, callback) => {
    const nextState =
      typeof update === "function"
        ? update(component.state, component.props)
        : update;
    component.state = { ...component.state, ...nextState };
    if (callback) {
      callback();
    }
  };
  return component;
};

it("reloads auths with the active filters and page size", () => {
  const fetchValue = {
    appKey: "app-key",
    phone: "13800000000",
    currentPage: 2,
    pageSize: 12,
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

it("passes the current query to update without issuing a second fetch", () => {
  const dispatch = jest.fn((action) => {
    if (action.type === "auth/fetchItem") {
      action.callback({ id: "auth-1" });
    }
  });
  const component = makeComponent(dispatch);
  component.state = {
    ...component.state,
    appKey: "app-key",
    phone: "13800000000",
    currentPage: 2,
    pageSize: 12,
  };

  component.editClick({ id: "auth-1" });
  component.state.popup.props.handleOk({ appKey: "updated-app-key" });

  const updateAction = dispatch.mock.calls.find(
    ([action]) => action.type === "auth/update",
  )[0];
  expect(updateAction.fetchValue).toEqual({
    appKey: "app-key",
    phone: "13800000000",
    currentPage: 2,
    pageSize: 12,
    namespaceId: "namespace-1",
  });

  updateAction.callback();
  expect(
    dispatch.mock.calls.filter(([action]) => action.type === "auth/fetch"),
  ).toHaveLength(0);
});
