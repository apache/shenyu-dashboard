import React, {Component} from "react";
import {Button, Form, Input, InputNumber, Popconfirm, Select, Table} from 'antd';
import {getIntlContent} from "../../../utils/IntlUtils";

const EditableContext = React.createContext();
const { Option } = Select;

class EditableCell extends Component {
  getInput = () => {
    if (this.props.inputType === 'number') {
      return <InputNumber />;
    } else if (this.props.inputType === 'dropdown') {
      // return <Select />;
      return (
        <Select>
          <Option value="0">open</Option>
          <Option value="1">close</Option>
        </Select>
      );
    }
    return <Input />;
  };

  renderCell = ({ getFieldDecorator }) => {
    const {
      editing,
      dataIndex,
      title,
      inputType,
      record,
      index,
      children,
      ...restProps
    } = this.props;
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item style={{ margin: 0 }}>
            {getFieldDecorator(dataIndex, {
              rules: [
                {
                  required: true,
                  message: `Please Input ${title}!`,
                },
              ],
              initialValue: record[dataIndex],
            })(this.getInput())}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  render() {
    return <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>;
  }
}

class EditableTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editingKey: '',
      isLocal: this.props.isLocal
    };
    this.columns = [
      {
        title: 'protocol',
        dataIndex: 'protocol',
        editable: true,
        width: '25%',
        align: 'center'
      },
      // {
      //   title: 'host',
      //   dataIndex: 'host',
      //   editable: true,
      //   // width: '33%',
      //   align: 'center'
      // },
      {
        title: 'url',
        dataIndex: 'url',
        editable: this.state.isLocal,
        width: '35%',
        align: 'center'
      },
      {
        title: 'status',
        dataIndex: 'status',
        editable: true,
        width: '19%',
        align: 'center',
        render: (text) => {
          return text === 0 || text === '0' ? 'open' : 'close';
        },
      },
      {
        title: 'weight',
        dataIndex: 'weight',
        editable: true,
        // width: '19%',
        align: 'center'
      },
      {
        title: 'startupTime',
        dataIndex: 'startupTime',
        editable: this.state.isLocal,
        // width: '19%',
        align: 'center'
      },
      {
        title: 'warmupTime',
        dataIndex: 'warmupTime',
        editable: true,
        // width: '19%',
        align: 'center'
      },
      {
        title: 'operation',
        dataIndex: 'operation',
        render: (text, record) => {
          const { editingKey } = this.state;
          const editable = this.isEditing(record);
          return (
            <span>
              {editable ? (
                <span>
                  <EditableContext.Consumer>
                    {form => (
                      <a
                        onClick={() => this.save(form, record.key)}
                        style={{ marginRight: 8 }}
                      >
                        Save
                      </a>
                    )}
                  </EditableContext.Consumer>
                  <Popconfirm title="Sure to cancel?" onConfirm={() => this.cancel(record.key)}>
                    <a>Cancel</a>
                  </Popconfirm>
                </span>
                ) : (
                  <span>
                    <a disabled={editingKey !== ''} onClick={() => this.edit(record.key)}>
                      Edit
                    </a>
                    {' '}
                    {this.props.dataSource.length >= 1 && this.state.isLocal ? (
                      <Popconfirm title="Sure to delete?" onConfirm={() => this.handleDelete(record.key)}>
                        <a>Delete</a>
                      </Popconfirm>
                    ) : null}
                  </span>
                )
              }
            </span>
          );
        },
      },
    ];
  }

  isEditing = record => record.key === this.state.editingKey;

  cancel = () => {
    this.setState({ editingKey: '' });
  };

  handleDelete = key => {
    const { dataSource } = this.props;
    const newData = dataSource.filter(item => item.key !== key);
    this.props.onTableChange(newData);
  };

  handleAdd = () => {
    const { dataSource, recordCount } = this.props;
    const newRecordCount = recordCount + 1;
    const newData = {
      key: newRecordCount,
      protocol: 'http://',
      url: 'localhost:',
      status: 0,
      weight: 50,
      startupTime: 0,
      warmupTime: 10
    };
    this.props.onTableChange([...dataSource, newData]);
    this.props.onCountChange(newRecordCount);
  };

  handleSave = row => {
    const newData = [...this.props.dataSource];
    const index = newData.findIndex(item => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    this.props.onTableChange(newData);
  };

  save(form, key) {
    form.validateFields((error, row) => {
      if (error) {
        return;
      }
      const newData = [...this.props.dataSource];
      const index = newData.findIndex(item => key === item.key);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, {
          ...item,
          ...row,
        });
        this.props.onTableChange(newData);
        this.setState({ editingKey: '' });
      } else {
        const { recordCount } = this.props;
        row.key = recordCount + 1;
        newData.push(row);
        this.props.onCountChange(recordCount + 1);
        this.props.onTableChange(newData);
        this.setState({ editingKey: '' });
      }
    });
  }

  edit(key) {
    this.setState({ editingKey: key });
  }

  render() {
    const components = {
      body: {
        cell: EditableCell,
      },
    };

    const columns = this.columns.map(col => {
      if (!col.editable) {
        return col;
      }

      let inputType = 'text';
      if (col.dataIndex === 'weight' || col.dataIndex === 'startupTime' || col.dataIndex === 'warmupTime') {
        inputType = 'number';
      } else if (col.dataIndex === 'status') {
        inputType = 'dropdown';
      }
      return {
        ...col,
        onCell: record => ({
          record,
          inputType,
          dataIndex: col.dataIndex,
          title: col.title,
          editing: this.isEditing(record),
        }),
      };
    });

    return (
      <div>
        {this.state.isLocal && (
          <Button onClick={this.handleAdd} type="primary" style={{ marginBottom: 16 }}>
            {getIntlContent("SHENYU.DISCOVERY.SELECTOR.UPSTREAM.ADD")}
          </Button>
        )}
        <EditableContext.Provider value={this.props.form}>
          <Table
            components={components}
            bordered
            dataSource={this.props.dataSource}
            columns={columns}
            rowClassName="editable-row"
            pagination={{
              onChange: this.cancel,
            }}
          />
        </EditableContext.Provider>
      </div>

    );
  }
}

const EditableFormTable = Form.create()(EditableTable);
export default EditableFormTable;

