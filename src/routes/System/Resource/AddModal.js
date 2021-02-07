import React, { Component } from 'react';
import { Modal, Form, Select, InputNumber, Input, Icon, Tooltip } from 'antd';
import IconModal from "./IconModal";
import { getIntlContent } from '../../../utils/IntlUtils';

const FormItem = Form.Item;
const { Option } = Select;

class AddModal extends Component {

  state = {
    popup: "",
    icon: undefined,
  }

  handleSubmit = (e) => {
    const { form, handleOk, id = '' } = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        handleOk({...values, id});
      }
    });
  }

  closeModal = () => {
    this.setState({ popup: "" });
  };

  handleChooseIcon = () => {
    this.setState({
      popup: (
        <IconModal
          onChooseIcon={(icon) => {
            const { form: { setFieldsValue }} = this.props;
            setFieldsValue({icon})
            this.setState({
              icon,
              popup: ""
            })
          }}
          handleCancel={() => {
            this.closeModal();
          }}
        />
      )
    })
  }

  render() {
    let { handleCancel, menuTree, id, parentId, perms, form, sort, title, icon, url, resourceType } = this.props;
    const { popup } = this.state;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 6 },
      },
      wrapperCol: {
        sm: { span: 18 },
      },
    };
    return (
      <Modal
        width={550}
        centered
        title={getIntlContent("SOUL.SYSTEM.RESOURCE")}
        visible
        okText={getIntlContent("SOUL.COMMON.SURE")}
        cancelText={getIntlContent("SOUL.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label={getIntlContent("SOUL.SYSTEM.RESOURCETYPE")}
            {...formItemLayout}
          >
            {getFieldDecorator('resourceType', {
              rules: [{ required: true, message: getIntlContent("SOUL.SYSTEM.RESOURCETYPE.INPUT") }],
              initialValue: resourceType,
            })(
              <Select disabled>
                <Option value={0}>{getIntlContent("SOUL.SYSTEM.MAINMENU")}</Option>
                <Option value={1}>{getIntlContent("SOUL.SYSTEM.SUBMENU")}</Option>
                <Option value={2}>{getIntlContent("SOUL.SYSTEM.BUTTON")}</Option>
              </Select>
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SOUL.SYSTEM.RESOURCENAME")}
            {...formItemLayout}
          >
            {getFieldDecorator('title', {
              rules: [{ required: true, message: getIntlContent("SOUL.SYSTEM.RESOURCENAME.INPUT") }],
              initialValue: (title && getIntlContent(title)) || title,
            })(
              <Input disabled={!!id} placeholder={getIntlContent("SOUL.SYSTEM.RESOURCENAME.INPUT")} />
            )}
          </FormItem>
          {resourceType !== 2 && menuTree && menuTree.length > 0 && (
          <FormItem
            label={getIntlContent("SOUL.SYSTEM.RESOURCE.PARENT")}
            {...formItemLayout}
          >
            {getFieldDecorator('parentId', {
              rules: [{ message: getIntlContent("SOUL.SYSTEM.RESOURCE.PARENT.INPUT") }],
              initialValue: parentId,
            })(
              <Select disabled={!!id} allowClear placeholder={getIntlContent("SOUL.SYSTEM.RESOURCE.PARENT.INPUT")} style={{width: '100%'}}>
                {menuTree.map((menu)=><Option value={menu.id} disabled={menu.url === "/plug"} key={menu.id}>{(menu.title && getIntlContent(menu.title)) || menu.title}</Option>)}
              </Select>
            )}
          </FormItem>
          )}
          {resourceType !== 2 && (
          <FormItem
            label={getIntlContent("SOUL.SYSTEM.ROUTER")}
            {...formItemLayout}
          >
            {getFieldDecorator('url', {
              rules: [{ required: true, message: getIntlContent("SOUL.SYSTEM.ROUTER.INPUT") }],
              initialValue: url,
            })(
              <Input disabled={!!id} placeholder={getIntlContent("SOUL.SYSTEM.ROUTER.INPUT")} />
            )}
          </FormItem>
          )}
          {resourceType !== 2 && (
          <FormItem
            label={getIntlContent("SOUL.SYSTEM.RESOURCEORDER")}
            {...formItemLayout}
          >
            {getFieldDecorator('sort', {
              rules: [{ required: true, message: getIntlContent("SOUL.SYSTEM.RESOURCEORDER.INPUT") }],
              initialValue: sort,
            })(
              <InputNumber style={{width:"100%"}} placeholder={getIntlContent("SOUL.SYSTEM.RESOURCEORDER.INPUT")} />
            )}
          </FormItem>
          )}
          {resourceType === 2 && (
          <FormItem
            label={getIntlContent("SOUL.SYSTEM.RESOURCE.PERMS")}
            {...formItemLayout}
          >
            {getFieldDecorator('perms', {
              rules: [{ message: getIntlContent("SOUL.SYSTEM.RESOURCE.PERMS.INPUT") }],
              initialValue: perms
            })(
              <Input disabled={!!id} placeholder={getIntlContent("SOUL.SYSTEM.RESOURCE.PERMS.INPUT")} />
            )}
          </FormItem>
          )}
          <FormItem
            label={getIntlContent("SOUL.SYSTEM.ICON")}
            {...formItemLayout}
          >
            {getFieldDecorator('icon', {
              rules: [{ required: false, message: getIntlContent("SOUL.SYSTEM.ICON.INPUT") }],
              initialValue: icon,
            })(
              <Input
                readOnly
                placeholder={!icon&&getIntlContent("SOUL.SYSTEM.ICON.INPUT")}
                prefix={(this.state.icon||icon)&&<Icon type={this.state.icon||icon} />}
                suffix={
                  <Tooltip title={getIntlContent("SOUL.SYSTEM.ICON.INPUT")}>
                    <Icon type="plus" onClick={this.handleChooseIcon} />
                  </Tooltip>
                }
              />
            )}
          </FormItem>
        </Form>
        {popup}
      </Modal>
    )
  }
}

export default Form.create()(AddModal);
