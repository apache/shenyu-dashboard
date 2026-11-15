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

/* eslint-disable react/static-property-placement */
import React, { Component } from "react";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Row from "@douyinfe/semi-ui/lib/es/grid/row";
import Col from "@douyinfe/semi-ui/lib/es/grid/col";
import omit from "omit.js";
import Form from "../ui/Form";
import LoginContext from "./LoginContext";
import styles from "./index.less";
import map from "./map";

const FormItem = Form.Item;

function generator({ defaultProps, defaultRules, type }) {
  return (WrappedComponent) => {
    return class BasicComponent extends Component {
      static contextType = LoginContext;

      constructor(props) {
        super(props);
        this.state = {
          count: 0,
        };
      }

      componentDidMount() {
        this.unregister = this.context.registerField(
          this.props.name,
          this.context.tab,
        );
      }

      componentWillUnmount() {
        clearInterval(this.interval);
        this.unregister();
      }

      onGetCaptcha = () => {
        let count = 59;
        this.setState({ count });
        const { onGetCaptcha } = this.props;
        if (onGetCaptcha) {
          onGetCaptcha();
        }
        this.interval = setInterval(() => {
          count -= 1;
          this.setState({ count });
          if (count === 0) {
            clearInterval(this.interval);
          }
        }, 1000);
      };

      render() {
        const { form } = this.context;
        const { getFieldDecorator } = form;
        const options = {};
        let otherProps = {};
        const { onChange, defaultValue, rules, name, ...restProps } =
          this.props;
        const { count } = this.state;
        options.rules = rules || defaultRules;
        if (defaultValue !== undefined) {
          options.initialValue = defaultValue;
        }
        otherProps = restProps || otherProps;
        if (type === "Captcha") {
          const inputProps = omit(otherProps, ["onGetCaptcha"]);
          return (
            <FormItem>
              <Row gutter={8}>
                <Col span={16}>
                  {getFieldDecorator(
                    name,
                    options,
                  )(
                    <WrappedComponent
                      {...defaultProps}
                      {...inputProps}
                      onChange={onChange}
                    />,
                  )}
                </Col>
                <Col span={8}>
                  <Button
                    disabled={count > 0}
                    className={styles.getCaptcha}
                    size="large"
                    onClick={this.onGetCaptcha}
                  >
                    {count ? `${count} s` : "获取验证码"}
                  </Button>
                </Col>
              </Row>
            </FormItem>
          );
        }
        return (
          <FormItem>
            {getFieldDecorator(
              name,
              options,
            )(
              <WrappedComponent
                {...defaultProps}
                {...otherProps}
                onChange={onChange}
              />,
            )}
          </FormItem>
        );
      }
    };
  };
}

const LoginItem = {};
Object.keys(map).forEach((item) => {
  LoginItem[item] = generator({
    defaultProps: map[item].props,
    defaultRules: map[item].rules,
    type: item,
  })(map[item].component);
});

export default LoginItem;
