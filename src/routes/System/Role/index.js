import React, { Component } from "react";
import { Table, Input, Button, message, Popconfirm } from "antd";
import { connect } from "dva";
import AddModal from "./AddModal";
import { getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from '../../../utils/AuthButton';

@connect(({ role, resource, loading }) => ({
  role,
  resource,
  loading: loading.effects["role/fetch"]
}))
export default class Role extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      selectedRowKeys: [],
      roleName: "",
      popup: ""
    };
  }

  componentWillMount() {
    const { currentPage } = this.state;
    this.getAllRoles(currentPage);
  }

  onSelectChange = selectedRowKeys => {
    this.setState({ selectedRowKeys });
  };

  getAllRoles = page => {
    const { dispatch } = this.props;
    const { roleName } = this.state;
    dispatch({
      type: "role/fetch",
      payload: {
        roleName,
        currentPage: page,
        pageSize: 12
      }
    });
  };

  pageOnchange = page => {
    this.setState({ currentPage: page });
    this.getAllRoles(page);
  };

  closeModal = () => {
    this.setState({ popup: "" });
  };

  editClick = record => {
    const { dispatch } = this.props;
    const { currentPage } = this.state;
    const name = this.state.roleName;
    dispatch({
      type: "role/fetchItem",
      payload: {
        id: record.id
      },
      callback: role => {
        this.setState({
          popup: (
            <AddModal
              {...role}
              handleOk={values => {
                const { roleName, description, id, currentPermissionIds } = values;
                dispatch({
                  type: "role/update",
                  payload: {
                    roleName,
                    description,
                    currentPermissionIds,
                    id
                  },
                  fetchValue: {
                    roleName: name,
                    currentPage,
                    pageSize: 12
                  },
                  callback: () => {
                    this.closeModal();
                  }
                });
              }}
              handleCancel={() => {
                this.closeModal();
              }}
            />
          )
        });
      }
    });
  };

  searchOnchange = e => {
    const roleName = e.target.value;
    this.setState({ roleName });
  };

  searchClick = () => {
    this.getAllRoles(1);
    this.setState({ currentPage: 1 });
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { roleName, currentPage, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "role/delete",
        payload: {
          list: selectedRowKeys
        },
        fetchValue: {
          roleName,
          currentPage,
          pageSize: 12
        },
        callback: () => {
          this.setState({ selectedRowKeys: [] });
        }
      });
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

  addClick = () => {
    const { currentPage } = this.state;
    const name = this.state.roleName;
    this.setState({
      popup: (
        <AddModal
          sysRole={{}}
          allPermissionInfo={{}}
          rolePermissionList={{}}
          handleOk={values => {
            const { dispatch } = this.props;
            const { roleName, description } = values;
            dispatch({
              type: "role/add",
              payload: {
                roleName,
                description
              },
              fetchValue: {
                roleName: name,
                currentPage,
                pageSize: 12
              },
              callback: () => {
                this.setState({ selectedRowKeys: [] });
                this.closeModal();
              }
            });
          }}
          handleCancel={() => {
            this.closeModal();
          }}
        />
      )
    });
  };

  render() {
    const { role, loading } = this.props;
    const { roleList, total } = role;
    const { currentPage, selectedRowKeys, roleName, popup } = this.state;
    const roleColumns = [
      {
        align: "center",
        title: getIntlContent("SOUL.SYSTEM.ROLENAME"),
        dataIndex: "roleName",
        key: "roleName",
        ellipsis:true,
      },
      {
        align: "center",
        title: getIntlContent("SOUL.SYSTEM.ROLE.DESCRIPTION"),
        dataIndex: "description",
        key: "description",
        ellipsis:true,
      },
      {
        align: "center",
        title: getIntlContent("SOUL.SYSTEM.CREATETIME"),
        dataIndex: "dateCreated",
        key: "dateCreated",
        ellipsis:true,
      },
      {
        align: "center",
        title: getIntlContent("SOUL.SYSTEM.UPDATETIME"),
        dataIndex: "dateUpdated",
        key: "dateUpdated",
        ellipsis:true,
      },
      {
        align: "center",
        title: getIntlContent("SOUL.COMMON.OPERAT"),
        dataIndex: "operate",
        key: "operate",
        ellipsis:true,
        render: (text, record) => {
          return (
            <AuthButton perms="system:role:edit">
              <div
                className="edit"
                onClick={() => {
                  this.editClick(record);
                }}
              >
                {getIntlContent("SOUL.SYSTEM.EDITOR")}
              </div>
            </AuthButton>
          );
        }
      }
    ];

    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange
    };

    return (
      <div className="plug-content-wrap">
        <div style={{ display: "flex" }}>
          <Input
            value={roleName}
            onChange={this.searchOnchange}
            placeholder={getIntlContent("SOUL.SYSTEM.ROLE.INPUT.NAME")}
            style={{ width: 240 }}
          />
          <AuthButton perms="system:role:list">
            <Button
              style={{ marginLeft: 20 }}
              type="primary"
              onClick={this.searchClick}
            >
              {getIntlContent("SOUL.SYSTEM.SEARCH")}
            </Button>
          </AuthButton>
          <AuthButton perms="system:role:delete">
            <Popconfirm
              title={getIntlContent("SOUL.COMMON.DELETE")}
              placement='bottom'
              onConfirm={() => {
                this.deleteClick()
              }}
              okText={getIntlContent("SOUL.COMMON.SURE")}
              cancelText={getIntlContent("SOUL.COMMON.CALCEL")}
            >
              <Button
                style={{ marginLeft: 20 }}
                type="danger"
              >
                {getIntlContent("SOUL.SYSTEM.DELETEDATA")}
              </Button>
            </Popconfirm>
          </AuthButton>
          <AuthButton perms="system:role:add">
            <Button
              style={{ marginLeft: 20 }}
              type="primary"
              onClick={this.addClick}
            >
              {getIntlContent("SOUL.SYSTEM.ADDDATA")}
            </Button>
          </AuthButton>
        </div>

        <Table
          size="small"
          style={{ marginTop: 30 }}
          bordered
          loading={loading}
          columns={roleColumns}
          dataSource={roleList}
          rowSelection={rowSelection}
          pagination={{
            total,
            current: currentPage,
            pageSize: 12,
            onChange: this.pageOnchange
          }}
        />
        {popup}
      </div>
    );
  }
}
