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

import React, { createContext, useContext, useMemo } from "react";
import {
  Link,
  MemoryRouter,
  Navigate,
  Route as NativeRoute,
  Routes,
  unstable_HistoryRouter as HistoryRouter,
  useLocation,
  useMatch,
  useNavigate,
  useParams,
  useResolvedPath,
} from "react-router-dom";

const HistoryContext = createContext(null);
const NAVIGATE = "@@router/CALL_HISTORY_METHOD";

function useRouteProps(path) {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const suppliedHistory = useContext(HistoryContext);
  const resolved = useResolvedPath(".");
  const match = useMatch({ path: path || "*", end: false });
  const history = useMemo(
    () =>
      suppliedHistory || {
        location,
        push: (to, state) => navigate(to, { state }),
        replace: (to, state) => navigate(to, { replace: true, state }),
        go: (delta) => navigate(delta),
        goBack: () => navigate(-1),
        goForward: () => navigate(1),
      },
    [suppliedHistory, navigate, location],
  );
  return {
    history,
    location,
    match: {
      path: path || resolved.pathname,
      url: match?.pathnameBase || resolved.pathname,
      isExact: match?.pathname === location.pathname,
      params: { ...params, ...match?.params },
    },
  };
}

export function Route({ component: Component, render, children, path, exact }) {
  const routeProps = useRouteProps(path);
  const matched = useMatch({ path: path || "*", end: Boolean(exact) });
  if (path && !matched) return null;
  if (Component) return <Component {...routeProps} />;
  if (render) return render(routeProps);
  return typeof children === "function"
    ? children(routeProps)
    : children || null;
}

export function Redirect({ to, push = false }) {
  return (
    <Navigate
      to={to}
      replace={!push}
      state={typeof to === "object" ? to.state : undefined}
    />
  );
}

function MatchedElement({ element, path }) {
  return React.cloneElement(element, useRouteProps(path));
}

function nestedPath(path, base, exact) {
  if (!path) return "*";
  const prefix = base.replace(/\/$/, "");
  let result =
    prefix && (path === prefix || path.startsWith(`${prefix}/`))
      ? path.slice(prefix.length) || "/"
      : path;
  if (!exact && !result.endsWith("*"))
    result = `${result.replace(/\/$/, "")}/*`;
  return result;
}

export function Switch({ children, location }) {
  const base = useResolvedPath(".").pathname;
  return (
    <Routes location={location}>
      {React.Children.toArray(children)
        .filter(React.isValidElement)
        .map((child, index) => {
          const path =
            child.type === Redirect ? child.props.from : child.props.path;
          return (
            <NativeRoute
              key={child.key || index}
              path={nestedPath(path, base, child.props.exact)}
              element={<MatchedElement element={child} path={path} />}
            />
          );
        })}
    </Routes>
  );
}

export function withRouter(Component) {
  function WithRouter(props) {
    return <Component {...props} {...useRouteProps()} />;
  }
  WithRouter.displayName = `withRouter(${Component.displayName || Component.name || "Component"})`;
  WithRouter.WrappedComponent = Component;
  return WithRouter;
}

export function ConnectedRouter({ history, children }) {
  return (
    <HistoryContext.Provider value={history}>
      <HistoryRouter history={history} future={{ v7_startTransition: true }}>
        {children}
      </HistoryRouter>
    </HistoryContext.Provider>
  );
}

export const routerRedux = {
  ConnectedRouter,
  push: (...args) => ({ type: NAVIGATE, payload: { method: "push", args } }),
  replace: (...args) => ({
    type: NAVIGATE,
    payload: { method: "replace", args },
  }),
  routerMiddleware: (history) => () => (next) => (action) => {
    if (action.type !== NAVIGATE) return next(action);
    const { method, args } = action.payload;
    if (method !== "push" && method !== "replace")
      throw new Error(`Unsupported navigation method: ${method}`);
    return history[method](...args);
  },
};

export { Link, MemoryRouter };
