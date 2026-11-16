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

import { message } from "../../../components/ui/feedback";
import ConnectedAuth from "./index";
import model from "../../../models/auth";

jest.mock("./AddModal", () => () => null);
jest.mock("./AddTable", () => () => null);
jest.mock("./RelateMetadataLoader", () => () => null);
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

  const updateCall = dispatch.mock.calls.find(
    ([action]) => action.type === "auth/update",
  );
  expect(updateCall).toBeDefined();
  const [updateAction] = updateCall;
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

it("ignores an older app-auth detail request after another resource editor is requested", () => {
  const dispatch = jest.fn();
  const component = makeComponent(dispatch);
  component.editClickMeta({ id: "auth-1", appKey: "first" });
  component.editClickMeta({ id: "auth-2", appKey: "second" });
  const details = dispatch.mock.calls
    .map(([a]) => a)
    .filter((a) => a.type === "auth/fetchItemDel");
  details[0].callback({ auth: [{ path: "/first" }] });
  expect(
    dispatch.mock.calls.filter(([a]) => a.type === "auth/fetchMeta"),
  ).toHaveLength(0);
  details[1].callback({ auth: [{ path: "/second" }] });
  const catalog = dispatch.mock.calls
    .map(([a]) => a)
    .find((a) => a.type === "auth/fetchMeta");
  catalog.callback({ dataList: [{ path: "/available" }] });
  expect(component.state.popup.props.id).toBe("auth-2");
});

it.each(["closeModal", "componentWillUnmount"])(
  "ignores resource detail completion after %s",
  (method) => {
    const dispatch = jest.fn();
    const component = makeComponent(dispatch);
    component.editClickMeta({ id: "auth-1", appKey: "first" });
    const request = dispatch.mock.calls[0][0];
    component[method]();
    request.callback({ auth: [{ path: "/first" }] });
    expect(dispatch.mock.calls.some(([a]) => a.type === "auth/fetchMeta")).toBe(
      false,
    );
  },
);

it("invalidates resource loads and saves when the namespace context changes", () => {
  const dispatch = jest.fn();
  const component = makeComponent(dispatch);
  component.editClickMeta({ id: "auth-1", appKey: "first" });
  dispatch.mock.calls[0][0].callback({ auth: [{ path: "/first" }] });
  const catalog = dispatch.mock.calls
    .map(([a]) => a)
    .find((a) => a.type === "auth/fetchMeta");
  catalog.callback({ dataList: [{ path: "/available" }] });
  const save = component.state.popup.props.handleOk;
  const previous = component.props;
  component.props = { ...previous, currentNamespaceId: "namespace-2" };
  component.componentDidUpdate(previous);
  dispatch.mockClear();
  save({ id: "auth-1", authPathDTOList: [{ path: "/first" }] });
  expect(component.state.popup).toBe("");
  expect(dispatch.mock.calls.some(([a]) => a.type === "auth/updateDel")).toBe(
    false,
  );
});

it("keeps the caller's app-auth ID authoritative for resource updates", () => {
  const dispatch = jest.fn();
  const component = makeComponent(dispatch);
  component.editClickMeta({ id: "auth-1", appKey: "first" });
  dispatch.mock.calls[0][0].callback({ auth: [{ path: "/first" }] });
  dispatch.mock.calls
    .map(([a]) => a)
    .find((a) => a.type === "auth/fetchMeta")
    .callback({ dataList: [{ path: "/available" }] });
  component.state.popup.props.handleOk({
    id: "metadata-id",
    authPathDTOList: [{ path: "/first" }],
  });
  const update = dispatch.mock.calls
    .map(([a]) => a)
    .find((a) => a.type === "auth/updateDel");
  expect(update.payload.id).toBe("auth-1");
  expect(update.payload).not.toHaveProperty("namespaceId");
});

it.each([200, 500])(
  "only closes and reloads resource authorization after a successful API result (%s)",
  (code) => {
    const callback = jest.fn();
    const fetchValue = {
      appKey: "demo",
      phone: "",
      currentPage: 2,
      pageSize: 12,
      namespaceId: "namespace-1",
    };
    const payload = {
      id: "auth-1",
      authPathDTOList: [{ path: "/orders", appName: "orders-app" }],
    };
    const call = (fn, value) => ({ fn, value });
    const success = jest.spyOn(message, "success").mockImplementation(() => {});
    const warn = jest.spyOn(message, "warn").mockImplementation(() => {});
    const request = model.effects.updateDel(
      { payload, callback, fetchValue },
      { call, put },
    );
    request.next();
    const result = request.next({ code, message: "Rejected" });
    if (code === 200) {
      expect(callback).toHaveBeenCalledTimes(1);
      expect(result.value).toEqual(put({ type: "reload", fetchValue }));
      expect(success).toHaveBeenCalled();
    } else {
      expect(callback).not.toHaveBeenCalled();
      expect(result.done).toBe(true);
      expect(warn).toHaveBeenCalledWith("Rejected");
    }
  },
);

it("does not close a newer resource editor when an earlier save succeeds", () => {
  const dispatch = jest.fn();
  const component = makeComponent(dispatch);
  const open = (id) => {
    component.editClickMeta({ id, appKey: id });
    dispatch.mock.calls
      .map(([a]) => a)
      .filter((a) => a.type === "auth/fetchItemDel")
      .slice(-1)[0]
      .callback({ auth: [{ path: `/${id}` }] });
    dispatch.mock.calls
      .map(([a]) => a)
      .filter((a) => a.type === "auth/fetchMeta")
      .slice(-1)[0]
      .callback({ dataList: [{ path: "/available" }] });
  };
  open("auth-1");
  component.state.popup.props.handleOk({
    id: "auth-1",
    authPathDTOList: [{ path: "/auth-1" }],
  });
  const saved = dispatch.mock.calls
    .map(([a]) => a)
    .find((a) => a.type === "auth/updateDel");
  component.closeModal();
  open("auth-2");
  saved.callback();
  expect(component.state.popup.props.id).toBe("auth-2");
});
