import React, {Component} from "react";
import {Modal, Form, Select, Input, Table} from 'antd';


const FormItem = Form.Item;
const {Option} = Select;

class AddTable extends Component {
  state = {
    selectedRowKeys: [], // Check here to configure the default column
    initialData: '',
    size: [],
  };

//   下拉框事件
  handleChange = (value) => {
    this.setState({initialData: value,})
  }

  handleSubmit = e => {
    const {form, handleOk, metaGroup} = this.props;
    const {selectedRowKeys, initialData} = this.state;
    const pathList = metaGroup[initialData].filter(item => {
      return selectedRowKeys.includes(item.id)
    }).map(item => {
      return item.path
    });
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        handleOk({pathList, ...values});
      }
    });
  };

  onSelectChange = selectedRowKeys => {
    this.setState({selectedRowKeys});
  }

  handleTableInput = (value, record) => {
    // eslint-disable-next-line guard-for-in
    for (let i in value) {
      record[i] = value[i];// 这一句是必须的，不然状态无法更改
      this.setState({
        // eslint-disable-next-line react/no-access-state-in-setstate
        size: this.state.size.map((item) => item.key === record.key ? {...item, [i]: value[i]} : item)
      })
    }
  }

  render() {
    let {
      handleCancel,
      form,
      metaGroup
    } = this.props;
    // 下拉框数据
    const appNameGroup = Object.getOwnPropertyNames(metaGroup)
    // 表格数据
    const {selectedRowKeys} = this.state;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
    };
    const columns = [
      {
        title: '资源路径',
        dataIndex: 'path',
        render: (text, record) => (
          <Input
            value={text}
            onChange={(e) => this.handleTableInput({path: e.target.value}, record)}
          />
        )
      },
      {
        title: '路径描述',
        dataIndex: 'pathDesc',
        render: (text, record) => (
          <Input
            value={text}
            onChange={(e) => this.handleTableInput({pathDesc: e.target.value}, record)}
          />
        )
      },
    ];


    //   根据下拉框选项自动更换数据
    const data = metaGroup[this.state.initialData];
    const {getFieldDecorator} = form;
    const formItemLayout = {
      labelCol: {
        sm: {span: 6}
      },
      wrapperCol: {
        sm: {span: 18}
      }
    };

    return (
      <Modal
        width={550}
        centered
        title="认证"
        visible
        okText="确定"
        cancelText="取消"
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label="应用名称"
            {...formItemLayout}
          >
            {getFieldDecorator('appName', {
              rules: [{
                required: true,
                message: '请选择 appName'
              }], initialValue: '请选择 appName',
            })
            (
              <Select showSearch onChange={this.handleChange}>
                {appNameGroup.map((item, index) => {
                  return (
                    <Option key={index} value={`${item}`}>
                      {item}
                    </Option>
                  )
                })}
              </Select>)}
          </FormItem>
          <FormItem
            label="电话"
            {...formItemLayout}
          >
            {getFieldDecorator("phone", {
              rules: [{
                required: true,
                message: "请输入phone"
              }],
            })(
              <Input placeholder="phone" />
            )}
          </FormItem>
          <FormItem label="app参数" {...formItemLayout}>
            {getFieldDecorator("appParam", {
              rules: [{
                required: true,
                message: "请输入appParam"
              }],
            })(
              <Input placeholder="appParam" />
            )}
          </FormItem>
          <FormItem label="用户ID" {...formItemLayout}>
            {getFieldDecorator("userId", {
              rules: [{
                required: true,
                message: "请输入userId"
              }],
            })(<Input placeholder="userId" />)}
          </FormItem>
          <FormItem label="扩展信息" {...formItemLayout}>
            {getFieldDecorator("extInfo", {
              rules: [{
                required: true,
                message: "请输入extInfo"
              }],
            })(<Input placeholder="extInfo" />)}
          </FormItem>
          {/* 下拉框关联表格 */}
          <Table
            bordered
            rowSelection={rowSelection}
            columns={columns}
            dataSource={data}
            rowKey={record => record.id}
            pagination={{current: 1, pageSize: 10}}
          />
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddTable);

