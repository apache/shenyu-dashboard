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
      if (item.title.startsWith("SOUL.")) {
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
        title={getIntlContent("SOUL.SYSTEM.ROLE")}
        visible
        okText={getIntlContent("SOUL.COMMON.SURE")}
        cancelText={getIntlContent("SOUL.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label={getIntlContent("SOUL.SYSTEM.ROLENAME")}
            {...formItemLayout}
          >
            {getFieldDecorator('roleName', {
              rules: [{ required: true, message: getIntlContent("SOUL.SYSTEM.ROLE.INPUT.NAME") }],
              initialValue: roleName,
            })(
              <Input placeholder={getIntlContent("SOUL.SYSTEM.ROLE.INPUT.NAME")} />
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SOUL.SYSTEM.ROLE.DESCRIPTION")}
            {...formItemLayout}
          >
            {getFieldDecorator('description', {
              rules: [{message: getIntlContent("SOUL.SYSTEM.ROLE.INPUT.DESCRIPTION") }],
              initialValue: description,
            })(
              <Input.TextArea autoSize placeholder={getIntlContent("SOUL.SYSTEM.ROLE.INPUT.DESCRIPTION")} />
            )}
          </FormItem>
        </Form>
        {treeList && treeList.length > 0 && (
        <Fragment>
          <Divider>{getIntlContent("SOUL.SYSTEM.ROLE.CONFIG")}</Divider>
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
