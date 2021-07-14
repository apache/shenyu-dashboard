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

import React, { Component } from 'react';
import { Button, Popconfirm } from 'antd';
import PropTypes from 'prop-types'
import { connect } from 'dva';

// button cache
let buttonCache = {};

/**
 *  reset authorized button cache
 *
 */
export function resetAuthButtonCache() {
  buttonCache = {};
}

/**
 * check button's authority
 *
 * @param {string} perms
 * @param {Array} permissions
 */
export function checkButtonAuth(perms, permissions) {
  if (perms && permissions && permissions.button && permissions.button.length > 0) {
    if(buttonCache && buttonCache[perms]){
      return buttonCache[perms];
    }
    let {button : functionsList} = permissions;
    let authFunctions = functionsList.filter((item) => {
      return item.perms === perms
    })
    const authFunction = (authFunctions && authFunctions.length > 0) ? authFunctions[0] : null;
    if(authFunction){
      buttonCache.perms = authFunction;
    }
    return authFunction;
  } else {
    return false;
  }
}

@connect(({ global }) => ({
    global,
  }))
export default class AuthButton extends Component {

  componentWillMount() {
    const { global: { permissions } } = this.props;
    if (!permissions || !permissions.menu || permissions.menu.length === 0) {
      resetAuthButtonCache();
    }
  }

  render() {
    const {perms, children, global: {permissions} } = this.props;
    const authButton = checkButtonAuth(perms, permissions);
    if(authButton){
      if(authButton.icon){
        const type = children.type;
        if(type === Button){
          return React.cloneElement(children, {icon: authButton.icon});
        } else if(type === Popconfirm && children.props.children && children.props.children.type === Button){
          let newChildren =  React.cloneElement(children.props.children , {icon: authButton.icon});
          return React.cloneElement(children, {children: newChildren});
        } else{
          return children;
        }
      } else {
        return children;
      }
    } else {
      return null;
    }
  }
}

AuthButton.propTypes = {
  perms: PropTypes.string.isRequired,
  children: PropTypes.element.isRequired
}
