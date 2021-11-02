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

import React, { Component, Fragment } from 'react';
import { Modal, Form, Input, Tree, Divider } from 'antd';
import { getIntlContent } from '../../../utils/IntlUtils';
import { filterTree }  from '../../../utils/utils';

const FormItem = Form.Item;
const { TreeNode } = Tree;

class AddModal extends Component {

  state = {
    expandedKeys: [],
    autoExpandParent: true,
    checkedKeys: [],
    selectedKeys: [],
  }

  componentDidMount() {
    let { allPermissionInfo: { treeList = [] }, rolePermissionList = [] } = this.props;
    if (treeList && treeList.length > 0) {
      let checkedKeys = [];
      if(rolePermissionList && rolePermissionList.length > 0){
        treeList.forEach(treeNode => filterTree(treeNode, (node) => {
          rolePermissionList.forEach(key=>{
            if(node.id === key && node.isLeaf){
              checkedKeys.push(key);
            }
          })
        }))
      }
      this.setState({
        expandedKeys: treeList.map(e => e.id),
        checkedKeys
      });
    }
  }

  handleSubmit = (e) => {
    const { form, handleOk, sysRole: { id = '' }, allPermissionInfo: { treeList = [] } } = this.props;
    const { checkedKeys } = this.state;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let currentPermissionIds = [...checkedKeys];
        if(checkedKeys&&checkedKeys.length > 0){
          treeList.forEach(treeNode => filterTree(treeNode, (node) => {
            checkedKeys.forEach(key=>{
              if(node.ids[node.ids.length -1] === key){
                currentPermissionIds = currentPermissionIds.concat(node.ids);
              }
            })
          }))
        }
        currentPermissionIds = [...new Set(currentPermissionIds)];

        handleOk({ ...values, id, currentPermissionIds });
      }
    });
  }

  onCheck = (checkedKeys) => {
    this.setState({ checkedKeys });
  };

  renderTreeNodes = (parentItem,data) => {
    data = data.sort((a,b)=>(a.sort||0)-(b.sort||0));
    return data.map(item => {
      if(!item.ids){
        if(parentItem){
          item.ids = parentItem.ids.concat(item.id);
        }else{
          item.ids = [item.id];
        }
      }
      item.displayName = item.title;
      if (item.title.startsWith("SHENYU.")) {
        item.displayName = getIntlContent(item.title);
      }
      if (item.children) {
        return (
          <TreeNode title={item.displayName} key={item.id} dataRef={item}>
            {this.renderTreeNodes(item,item.children)}
          </TreeNode>
        );
      }
      return <TreeNode title={item.displayName} key={item.id} dataRef={item} />;
    });
  }

  renderResourceTree = (treeList) => {
    return (
      <Tree
        checkable
        defaultExpandedKeys={this.state.expandedKeys}
        autoExpandParent={this.state.autoExpandParent}
        onCheck={this.onCheck}
        checkedKeys={this.state.checkedKeys}
        selectedKeys={this.state.selectedKeys}
        style={{ display: "flex", justifyContent: "space-around", width: "100%"}}
      >
        {this.renderTreeNodes(null, treeList)}
      </Tree>
    )
  }

  render() {
    let { handleCancel, form, sysRole: { roleName = '', description = '' }, allPermissionInfo: { treeList = [] } } = this.props;

    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 5 },
      },
      wrapperCol: {
        sm: { span: 19 },
      },
    };
    return (
      <Modal
        width={900}
        centered
        title={getIntlContent("SHENYU.SYSTEM.ROLE")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.ROLENAME")}
            {...formItemLayout}
          >
            {getFieldDecorator('roleName', {
              rules: [{ required: true, message: getIntlContent("SHENYU.SYSTEM.ROLE.INPUT.NAME") }],
              initialValue: roleName,
            })(
              <Input placeholder={getIntlContent("SHENYU.SYSTEM.ROLE.INPUT.NAME")} />
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.ROLE.DESCRIPTION")}
            {...formItemLayout}
          >
            {getFieldDecorator('description', {
              rules: [{message: getIntlContent("SHENYU.SYSTEM.ROLE.INPUT.DESCRIPTION") }],
              initialValue: description,
            })(
              <Input.TextArea autoSize placeholder={getIntlContent("SHENYU.SYSTEM.ROLE.INPUT.DESCRIPTION")} />
            )}
          </FormItem>
        </Form>
        {treeList && treeList.length > 0 && (
        <Fragment>
          <Divider>{getIntlContent("SHENYU.SYSTEM.ROLE.CONFIG")}</Divider>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            {this.renderResourceTree(treeList)}
          </div>
        </Fragment>
        )}
      </Modal>
    )
  }
}

export default Form.create()(AddModal);
