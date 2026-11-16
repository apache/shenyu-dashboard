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
import Spin from "@douyinfe/semi-ui/lib/es/spin";

export default class PromiseRender extends React.PureComponent {
  requestId = 0;

  constructor(props) {
    super(props);
    this.state = {
      component: null,
      prevPropsPromise: null,
    };
  }

  componentDidMount() {
    this.mounted = true;
    this.setRenderComponent(this.props);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.promise !== prevState.prevPropsPromise) {
      return {
        prevPropsPromise: nextProps.promise,
        component: null,
      };
    }
    return null;
  }

  componentDidUpdate(prevProps) {
    if (this.props.promise !== prevProps.promise) {
      this.setRenderComponent(this.props);
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    this.requestId += 1;
  }

  // set render Component : ok or error
  setRenderComponent(props) {
    this.requestId += 1;
    const requestId = this.requestId;
    const ok = this.checkIsInstantiation(props.ok);
    const error = this.checkIsInstantiation(props.error);
    props.promise
      .then(() => {
        if (!this.mounted || requestId !== this.requestId) return;
        this.setState({
          component: ok,
        });
      })
      .catch(() => {
        if (!this.mounted || requestId !== this.requestId) return;
        this.setState({
          component: error,
        });
      });
  }

  // Determine whether the incoming component has been instantiated
  // AuthorizedRoute is already instantiated
  // Authorized  render is already instantiated, children is no instantiated
  // Secured is not instantiated
  checkIsInstantiation = (target) => {
    if (!React.isValidElement(target)) {
      return target;
    }
    return () => target;
  };

  render() {
    const { component: Component } = this.state;
    return Component ? (
      <Component {...this.props} />
    ) : (
      <div
        role="status"
        aria-label="Loading permissions"
        aria-busy="true"
        style={{
          width: "100%",
          height: "100%",
          margin: "auto",
          paddingTop: 50,
          textAlign: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }
}
