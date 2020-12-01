import React, { Component } from "react";
import { Modal, Form, Select, Input, Table, Button, Popconfirm } from 'antd';


const FormItem = Form.Item;
const { Option } = Select;

class AddTable extends Component {
  constructor(props) {
    super(props);
    this.columns = [
      {
        title: '资源路径',
        dataIndex: 'path',
        editable: 'true',
        render: (text, record) => (
          <Input
            placeholder="/"
            value={text}
            onChange={(e) => this.handleTableInput({ path: e.target.value }, record)}
          />
        )
      },
      {
        title: '路径描述',
        dataIndex: 'pathDesc',
        editable: 'true',
        render: (text, record) => (
          <Input
            value={text}
            onChange={(e) => this.handleTableInput({ pathDesc: e.target.value }, record)}
          />
        )
      },
      {
        title: '操作',
        dataIndex: 'operation',
        render: (text, record) =>
          this.state.allData.length > 1 ? (
            <Popconfirm title="确定删除?" onConfirm={() => this.handleDelete(record.key)}>
              <a>删除</a>
            </Popconfirm>
          ) : null,
      },
    ];
    this.state = {
      selectedRowKeys: [], // Check here to configure the default column
      tableInput: [],
      allData: [],
      newSelectInput: []
    };
  }

  //   下拉框事件
  handleChange = (value) => {
    this.props.form.setFieldsValue({ appName: value });
    this.setState({
      allData: (this.props.metaGroup[value] === undefined || this.props.metaGroup[value] === null) ? [{
        key: 0,
        path: '',
        pathDesc: '',
      }] : this.props.metaGroup[value]
    });
  }

  handleSubmit = e => {
    const { form, handleOk } = this.props;
    const { selectedRowKeys, allData } = this.state;
    const pathList = allData.filter(item => {
      let cur = item.id === undefined ? item.key : item.id
      return selectedRowKeys.includes(cur)
    }).map(item => {
      return item.path
    });
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        handleOk({ pathList, ...values });
      }
    });
  };

  onSelectChange = selectedRowKeys => {
    this.setState({ selectedRowKeys });
  }

  handleTableInput = (value, record) => {
    // eslint-disable-next-line guard-for-in
    for (let i in value) {
      record[i] = value[i];// 这一句是必须的，不然状态无法更改
      this.setState({
        // eslint-disable-next-line react/no-access-state-in-setstate
        tableInput: this.state.tableInput.map((item) => item.key === record.key ? { ...item, [i]: value[i] } : item)
      })
    }
  }

  handleAddTd = () => {
    const allData = this.state.allData

    const newData = {
      key: allData.length,
      path: '',
      pathDesc: '',
    };

    this.setState({
      allData: [...allData, newData]
    })
  }

  handleDelete = (key) => {
    // const allData = [...this.state.allData];
    this.setState((prev) => ({
      allData: prev.allData.filter((item) => item.key !== key),
    }));
  };

  onSearchSelect = (value, index) => {
    const { newSelectInput } = this.state;
    const flag = !!value
    if (flag) {
      newSelectInput[index] = value || '';
      this.setState({ newSelectInput });
    }
  }

  onBlurSelect = (index) => {
    const { newSelectInput } = this.state;
    const value = newSelectInput[index];
    const flag = !!value
    if (flag) {
      this.handleChange(value);
      delete newSelectInput[index]; // 在onBlur后将对应的key删除，防止当从下拉框中选择后再次触发onBlur时经过此处恢复成原来的值
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
    const { selectedRowKeys } = this.state;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
    };
    const columns = this.columns


    //   根据下拉框选项自动更换数据
    const data = this.state.allData;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 6 }
      },
      wrapperCol: {
        sm: { span: 18 }
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
                message: '请选择 应用名称',

              }],
            })
              (
                <Select
                  showSearch
                  placeholder="请选择 应用名称"
                  onChange={this.handleChange}
                  onSearch={value => this.onSearchSelect(value, '0')}
                  onBlur={() => this.onBlurSelect('0')}
                >
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
          <div>
            {
              data.length < 1 ?
                (
                  <Button
                    disabled
                    onClick={this.handleAddTd}
                    type="primary"
                    style={{
                      marginBottom: 16,
                    }}
                  >
                    添加
                  </Button>
                ) :
                (
                  <Button
                    onClick={this.handleAddTd}
                    type="primary"
                    style={{
                      marginBottom: 16,
                    }}
                  >
                    添加
                  </Button>
                )
            }
            <Table
              bordered
              rowSelection={rowSelection}
              columns={columns}
              dataSource={data}
              rowKey={record => record.id}
              pagination={{ current: 1, pageSize: 10 }}
            />
          </div>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddTable);

