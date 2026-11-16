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
import { createMemoryHistory } from "history";
import {
  MemoryRouter,
  Route,
  Switch,
  Redirect,
  Link,
  withRouter,
  routerRedux,
} from "./router";

const Login = () => <div>Login page</div>;
function UserLayout({ match }) {
  return (
    <Switch>
      <Route exact path={`${match.path}/login`} component={Login} />
      <Redirect from={match.path} to="/user/login" />
    </Switch>
  );
}

it.each(["/user", "/user/login", "/user/unknown"])(
  "preserves nested absolute routes and redirects for %s",
  async (path) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Switch>
          <Route path="/user" component={UserLayout} />
          <Route render={() => <div>Not found</div>} />
        </Switch>
      </MemoryRouter>,
    );
    await screen.findByText("Login page");
    expect(screen.queryByText("Not found")).toBeNull();
  },
);

it("keeps the static MCP route ahead of the generic plugin route", () => {
  render(
    <MemoryRouter initialEntries={["/plug/Mcp/mcpServer"]}>
      <Switch>
        <Route
          path="/plug/Mcp/mcpServer"
          component={() => <div>MCP page</div>}
        />
        <Route
          path="/plug/:index/:id"
          component={() => <div>Generic plugin</div>}
        />
      </Switch>
    </MemoryRouter>,
  );
  expect(screen.getByText("MCP page")).toBeDefined();
  expect(screen.queryByText("Generic plugin")).toBeNull();
});

it("supplies existing plugin route parameters and pattern props", () => {
  const Plugin = ({ match, location }) => (
    <div>{`${match.path}|${match.params.index}|${match.params.id}|${location.pathname}`}</div>
  );
  render(
    <MemoryRouter initialEntries={["/plug/Proxy/divide"]}>
      <Switch>
        <Route path="/plug/:index/:id" component={Plugin} />
      </Switch>
    </MemoryRouter>,
  );
  expect(
    screen.getByText("/plug/:index/:id|Proxy|divide|/plug/Proxy/divide"),
  ).toBeDefined();
});

it("updates withRouter props after link navigation", async () => {
  const Header = withRouter(({ location }) => (
    <div>
      <Link to="/home">Home link</Link>
      <span>{location.pathname}</span>
    </div>
  ));
  render(
    <MemoryRouter initialEntries={["/config/metadata"]}>
      <Header />
    </MemoryRouter>,
  );
  expect(screen.getByText("/config/metadata")).toBeDefined();
  fireEvent.click(screen.getByText("Home link"));
  await screen.findByText("/home");
});

it("dispatches push and replace navigation with query and state", () => {
  const history = createMemoryHistory({ initialEntries: ["/user/login"] });
  const next = jest.fn();
  const middleware = routerRedux.routerMiddleware(history)({})(next);
  middleware(routerRedux.push("/home?source=login", { selected: "a" }));
  expect(history.location).toMatchObject({
    pathname: "/home",
    search: "?source=login",
    state: { selected: "a" },
  });
  middleware(routerRedux.replace({ pathname: "/exception/403" }));
  expect(history.location.pathname).toBe("/exception/403");
  const unrelated = { type: "global/savePermissions" };
  middleware(unrelated);
  expect(next).toHaveBeenCalledWith(unrelated);
});
