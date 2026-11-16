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

import React, { Component } from "react";
import Tabs from "@douyinfe/semi-ui/lib/es/tabs";
import classNames from "classnames";
import Form from "../ui/Form";
import { LoginProvider } from "./LoginContext";
import LoginItem from "./LoginItem";
import LoginTab from "./LoginTab";
import LoginSubmit from "./LoginSubmit";
import LoginCode from "./LoginCode";
import styles from "./index.module.less";

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = { type: props.defaultActiveKey };
    this.fields = new Map();
  }

  registerField = (name, tab) => {
    if (!this.fields.has(tab)) this.fields.set(tab, new Set());
    const fields = this.fields.get(tab);
    fields.add(name);
    return () => fields.delete(name);
  };

  getTabs = () => {
    const tabs = [];
    React.Children.forEach(this.props.children, (child) => {
      if (child?.type?.isLoginTab) tabs.push(child);
    });
    return tabs;
  };

  handleSubmit = (event) => {
    event.preventDefault();
    const { form, onSubmit = () => {} } = this.props;
    const type = this.state.type ?? this.getTabs()[0]?.key;
    const names = [
      ...new Set([
        ...(this.fields.get("") || []),
        ...(this.fields.get(type) || []),
      ]),
    ];
    form.validateFields(names, (errors, values) => onSubmit(errors, values));
  };

  render() {
    const { className, children, form, onTabChange = () => {} } = this.props;
    const tabs = this.getTabs();
    const type = this.state.type ?? tabs[0]?.key;
    return (
      <div className={classNames(className, styles.login)}>
        <LoginProvider form={form} registerField={this.registerField}>
          <Form onSubmit={this.handleSubmit}>
            {tabs.length ? (
              <>
                <Tabs
                  activeKey={type}
                  keepDOM
                  onChange={(next) => {
                    this.setState({ type: next });
                    onTabChange(next);
                  }}
                >
                  {tabs.map((tab) => (
                    <Tabs.TabPane
                      key={tab.key}
                      itemKey={tab.key}
                      tab={tab.props.tab}
                    >
                      <LoginProvider
                        form={form}
                        registerField={this.registerField}
                        tab={tab.key}
                      >
                        {tab.props.children}
                      </LoginProvider>
                    </Tabs.TabPane>
                  ))}
                </Tabs>
                {React.Children.toArray(children).filter(
                  (child) => !child.type?.isLoginTab,
                )}
              </>
            ) : (
              children
            )}
          </Form>
        </LoginProvider>
      </div>
    );
  }
}

const LoginForm = Form.create()(Login);
LoginForm.Tab = LoginTab;
LoginForm.Submit = LoginSubmit;
LoginForm.LoginCode = LoginCode;
Object.assign(LoginForm, LoginItem);
export default LoginForm;
