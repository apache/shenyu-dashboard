import React, {Component, createContext} from "react";
import { Table, Input, Button, Popconfirm, Form } from 'antd';
import AuthButton from "../../../utils/AuthButton";
import {getIntlContent} from "../../../utils/IntlUtils";


const EditableContext = createContext();

const EditableRow = ({ form, index, ...props }) => (
  <EditableContext.Provider value={form}>
    <tr {...props} />
  </EditableContext.Provider>
);

const EditableFormRow = Form.create()(EditableRow);

class EditableCell extends Component {
  state = {
    editing: false,
  };

  toggleEdit = () => {
    this.setState(prevState => ({ editing: !prevState.editing }), () => {
      if (this.state.editing) {
        this.input.focus();
      }
    });
  };

  save = e => {
    const { record, handleSave } = this.props;
    this.form.validateFields((error, values) => {
      if (error && error[e.currentTarget.id]) {
        return;
      }
      this.toggleEdit();
      handleSave({ ...record, ...values });
    });
  };


  renderCell = form => {
    this.form = form;
    const { children, dataIndex, record, title } = this.props;
    const { editing } = this.state;
    return editing ? (
      <Form.Item style={{ margin: 0 }}>
        {form.getFieldDecorator(dataIndex, {
          rules: [
            {
              required: true,
              message: `${title} is required.`,
            },
          ],
          initialValue: record[dataIndex],
        })(<Input allowClear ref={node => { this.input = node }} onPressEnter={this.save} onBlur={this.save} />
        )}
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{ paddingRight: 24 }}
        onClick={this.toggleEdit}
      >
        {children}
      </div>
    );
  };

  render() {
    const {
      editable,
      dataIndex,
      title,
      record,
      index,
      handleSave,
      children,
      ...restProps
    } = this.props;
    return (
      <td {...restProps}>
        {editable ? (
          <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>
        ) : (
          children
        )}
      </td>
    );
  }
}


export default class EditableTable extends Component {
  constructor(props) {
    super(props);
    this.columns = [
      {
        title: 'protocol',
        dataIndex: 'protocol',
        editable: true,
        // width: '20%',
        align: 'center'
      },
      {
        title: 'url',
        dataIndex: 'url',
        editable: true,
        width: '33%',
        align: 'center'
      },
      {
        title: 'status',
        dataIndex: 'status',
        editable: true,
        // width: '19%',
        align: 'center'
      },
      {
        title: 'weight',
        dataIndex: 'weight',
        editable: true,
        // width: '19%',
        align: 'center'
      },
      {
        title: getIntlContent("SHENYU.DISCOVERY.SELECTOR.UPSTREAM.OPERATION"),
        dataIndex: 'operation',
        align: 'center',
        render: (text, record) =>
          this.props.dataSource.length >= 1 ? (
            <Popconfirm title={getIntlContent("SHENYU.DISCOVERY.SELECTOR.UPSTREAM.DELETE")} onConfirm={() => this.handleDelete(record.key)}>
              <a>{getIntlContent("SHENYU.BUTTON.SYSTEM.DELETE")}</a>
            </Popconfirm>
          ) : null,
      },
    ];

  }

  handleDelete = key => {
    const { dataSource } = this.props;
    const newData = dataSource.filter(item => item.key !== key);
    this.props.onTableChange(newData);
  };

  handleAdd = () => {
    const { dataSource, recordCount} = this.props;
    const newRecordCount = recordCount + 1;
    const newData = {
      key: newRecordCount,
      protocol: 'protocol',
      url: 'url',
      status: '0',
      weight: '0',
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

  render() {
    const { dataSource } = this.props;
    const components = {
      body: {
        row: EditableFormRow,
        cell: EditableCell,
      },
    };
    const columns = this.columns.map(col => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: record => ({
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          handleSave: this.handleSave,
        }),
      };
    });
    return (
      <div>
        <AuthButton perms="plugin:tcpSelector:add">
          <Button onClick={this.handleAdd} type="primary" style={{ marginBottom: 16 }}>
            {getIntlContent("SHENYU.DISCOVERY.SELECTOR.UPSTREAM.ADD")}
          </Button>
        </AuthButton>
        <Table
          components={components}
          rowClassName={() => 'editable-row'}
          bordered
          dataSource={dataSource}
          columns={columns}
        />
      </div>
    );
  }
}

