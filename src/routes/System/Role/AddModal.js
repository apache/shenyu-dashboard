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
import Tree from "@douyinfe/semi-ui/lib/es/tree";
import Divider from "@douyinfe/semi-ui/lib/es/divider";
import Modal from "../../../components/ui/Modal";
import Form from "../../../components/ui/Form";
import Input from "../../../components/ui/Input";
import { getIntlContent } from "../../../utils/IntlUtils";
import { filterTree } from "../../../utils/utils";

const FormItem = Form.Item;
function permissionTree(nodes, parentIds = []) {
  return [...nodes]
    .sort((left, right) => (left.sort || 0) - (right.sort || 0))
    .map((node) => {
      const ids = [...parentIds, node.id];
      return {
        ...node,
        key: node.id,
        ids,
        label: node.title.startsWith("SHENYU.")
          ? getIntlContent(node.title)
          : node.title,
        children: node.children
          ? permissionTree(node.children, ids)
          : undefined,
      };
    });
}

function initialGrants(props) {
  const granted = new Set(
    Array.isArray(props.rolePermissionList) ? props.rolePermissionList : [],
  );
  const keys = [];
  (props.allPermissionInfo.treeList || []).forEach((root) =>
    filterTree(root, (node) => {
      if (node.isLeaf && granted.has(node.id)) keys.push(node.id);
    }),
  );
  return keys;
}

class AddModal extends Component {
  constructor(props) {
    super(props);
    this.state = { checkedKeys: initialGrants(props) };
  }

  handleSubmit = (e) => {
    const {
      form,
      handleOk,
      sysRole: { id = "" },
      allPermissionInfo: { treeList = [] },
    } = this.props;
    const { checkedKeys } = this.state;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let currentPermissionIds = [...checkedKeys];
        if (checkedKeys && checkedKeys.length > 0) {
          permissionTree(treeList).forEach((treeNode) =>
            filterTree(treeNode, (node) => {
              checkedKeys.forEach((key) => {
                if (node.ids[node.ids.length - 1] === key) {
                  currentPermissionIds = currentPermissionIds.concat(node.ids);
                }
              });
            }),
          );
        }
        currentPermissionIds = [...new Set(currentPermissionIds)];

        handleOk({ ...values, id, currentPermissionIds });
      }
    });
  };

  renderResourceTree = (treeList) =>
    permissionTree(treeList).map((root) => {
      const rootKeys = new Set();
      filterTree(root, (node) => rootKeys.add(node.key));
      return (
        <Tree
          key={root.key}
          aria-label={root.label}
          treeData={[root]}
          multiple
          checkRelation="related"
          autoMergeValue
          leafOnly
          value={this.state.checkedKeys.filter((key) => rootKeys.has(key))}
          onChange={(keys) =>
            this.setState(({ checkedKeys }) => ({
              checkedKeys: [
                ...checkedKeys.filter((key) => !rootKeys.has(key)),
                ...keys,
              ],
            }))
          }
          defaultExpandedKeys={[root.key]}
          autoExpandParent
          motion={false}
          filterTreeNode={
            root.name === "plug"
              ? (input, label, node) =>
                  node.ids.length === 2 && node.name.includes(input)
              : false
          }
          searchPlaceholder="Filter by plugin name"
          showFilteredOnly
          style={{ width: "100%" }}
        />
      );
    });

  render() {
    let {
      handleCancel,
      form,
      sysRole: { roleName = "", description = "" },
      allPermissionInfo: { treeList = [] },
    } = this.props;

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
            {getFieldDecorator("roleName", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.SYSTEM.ROLE.INPUT.NAME"),
                },
              ],
              initialValue: roleName,
            })(
              <Input
                allowClear
                placeholder={getIntlContent("SHENYU.SYSTEM.ROLE.INPUT.NAME")}
              />,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.ROLE.DESCRIPTION")}
            {...formItemLayout}
          >
            {getFieldDecorator("description", {
              rules: [
                {
                  message: getIntlContent(
                    "SHENYU.SYSTEM.ROLE.INPUT.DESCRIPTION",
                  ),
                },
              ],
              initialValue: description,
            })(
              <Input.TextArea
                autoSize
                placeholder={getIntlContent(
                  "SHENYU.SYSTEM.ROLE.INPUT.DESCRIPTION",
                )}
              />,
            )}
          </FormItem>
        </Form>
        {treeList && treeList.length > 0 && (
          <>
            <Divider>{getIntlContent("SHENYU.SYSTEM.ROLE.CONFIG")}</Divider>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
                width: "100%",
              }}
            >
              {this.renderResourceTree(treeList)}
            </div>
          </>
        )}
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
