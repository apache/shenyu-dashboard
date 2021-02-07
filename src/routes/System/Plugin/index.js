import React, { Component } from "react";
import { Table, Input, Button, message, Popconfirm } from "antd";
import { connect } from "dva";
import { resizableComponents } from '../../../utils/resizable';
import AddModal from "./AddModal";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from '../../../utils/AuthButton';
import {resetAuthMenuCache} from '../../../utils/AuthRoute';

@connect(({ plugin, loading, global }) => ({
  plugin,
  language: global.language,
  loading: loading.effects["plugin/fetch"]
}))
export default class Plugin extends Component {
  components = resizableComponents;

  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      selectedRowKeys: [],
      name: "",
      popup: "",
      localeName: window.sessionStorage.getItem('locale') ? window.sessionStorage.getItem('locale') : 'en-US',
    };
  }

  componentWillMount() {
    const { currentPage } = this.state;
    this.getAllPlugins(currentPage);
    this.initPluginColumns();
  }

  componentDidUpdate() {
    const { language } = this.props;
    const { localeName } = this.state;
    if (language !== localeName) {
      this.initPluginColumns();
      this.changeLocale(language);
    }
  }

  handleResize = index => (e, { size }) => {
    this.setState(({ columns }) => {
      const nextColumns = [...columns];
      nextColumns[index] = {
        ...nextColumns[index],
        width: size.width,
      };
      return { columns: nextColumns };
    });
  };

  onSelectChange = selectedRowKeys => {

    this.setState({ selectedRowKeys });
  };

  getAllPlugins = page => {
    const { dispatch } = this.props;
    const { name } = this.state;
    dispatch({
      type: "plugin/fetch",
      payload: {
        name,
        currentPage: page,
        pageSize: 12
      }
    });
  };

  pageOnchange = page => {
    this.setState({ currentPage: page });
    this.getAllPlugins(page);
  };

  closeModal = () => {
    this.setState({ popup: "" });
  };

  editClick = record => {
    const { dispatch } = this.props;
    const { currentPage } = this.state;
    const pluginName = this.state.name;
    dispatch({
      type: "plugin/fetchItem",
      payload: {
        id: record.id
      },
      callback: plugin => {
        dispatch({
          type: "plugin/fetchByPluginId",
          payload: {
            pluginId: record.id,
            type: '3'
          },
          callback: pluginConfigList => {
            this.setState({
              popup: (
                <AddModal
                  disabled={true}
                  {...plugin}
                  {...pluginConfigList}
                  handleOk={values => {
                    const { name, enabled, id, role, config } = values;
                    dispatch({
                      type: "plugin/update",
                      payload: {
                        config,
                        role,
                        name,
                        enabled,
                        id
                      },
                      fetchValue: {
                        name: pluginName,
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
          }
        })
      }
    });
  };

  searchOnchange = e => {
    const name = e.target.value;
    this.setState({ name });
  };

  searchClick = () => {
    this.getAllPlugins(1);
    this.setState({ currentPage: 1 });
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { name, currentPage, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "plugin/delete",
        payload: {
          list: selectedRowKeys
        },
        fetchValue: {
          name,
          currentPage,
          pageSize: 12
        },
        callback: () => {
          this.setState({ selectedRowKeys: [] });
          dispatch({
            type: "global/fetchPlugins",
            payload: {
              callback: () => { }
            }
          });
          this.fetchPermissions();
        }
      });
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

  addClick = () => {
    const { currentPage } = this.state;
    const pluginName = this.state.name;
    this.setState({
      popup: (
        <AddModal
          disabled={false}
          handleOk={values => {
            const { dispatch } = this.props;
            const { name, enabled, role,config } = values;
            dispatch({
              type: "plugin/add",
              payload: {
                name,
                config,
                role,
                enabled
              },
              fetchValue: {
                name: pluginName,
                currentPage,
                pageSize: 12
              },
              callback: () => {
                this.closeModal();
                dispatch({
                  type: "global/fetchPlugins",
                  payload: {
                    callback: () => { }
                  }
                });
                this.fetchPermissions();
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

  fetchPermissions = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/refreshPermission',
      payload: {
        callback: () => {
          resetAuthMenuCache();
        }
      }
    });
  }

  // 批量启用或禁用
  enableClick = () => {
    const {dispatch} = this.props;
    const {selectedRowKeys, currentPage, name} = this.state;
    if(selectedRowKeys && selectedRowKeys.length>0) {
      dispatch({
        type: "plugin/fetchItem",
        payload: {
          id: selectedRowKeys[0]
        },
        callback: user => {
          dispatch({
            type: "plugin/updateEn",
            payload: {
              list: selectedRowKeys,
              enabled: !user.enabled
            },
            fetchValue: {
              name,
              currentPage,
              pageSize: 12
            },
            callback: () => {
              this.setState({selectedRowKeys: []});
            }
          })
        }
      })
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  }

  // 同步插件数据
  syncAllClick = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "plugin/asyncAll"
    });
  };

  operateChange = (checked, record) => {
    const { dispatch } = this.props;
    const { id } = record;
    dispatch({
      type: 'plugin/changeStatus',
      payload: { id, enabled: checked }
    })
  }

  changeLocale(locale) {
    this.setState({
      localeName: locale
    });
    getCurrentLocale(this.state.localeName);
  }

  initPluginColumns() {
    this.setState({
      columns: [
        {
          align: "center",
          title: getIntlContent("SOUL.PLUGIN.PLUGIN.NAME"),
          dataIndex: "name",
          key: "name",
          ellipsis:true,
          width: 180,
        },
        {
          align: "center",
          title: getIntlContent("SOUL.SYSTEM.ROLE"),
          dataIndex: "role",
          ellipsis:true,
          key: "role",
          render: (text) => {
            const map = {
              0: getIntlContent("SOUL.SYSTEM.SYSTEM"),
              1: getIntlContent("SOUL.SYSTEM.CUSTOM")
            }
            return <div>{map[text] || '----'}</div>
          }
        },
        {
          align: "center",
          title: getIntlContent("SOUL.COMMON.SETTING"),
          dataIndex: "config",
          key: "config",
          ellipsis:true,
          width: 180,
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
          title: getIntlContent("SOUL.SYSTEM.STATUS"),
          dataIndex: "enabled",
          key: "enabled",
          ellipsis:true,
          render: text => {
            if (text) {
              return <div className="open">{getIntlContent("SOUL.COMMON.OPEN")}</div>;
            } else {
              return <div className="close">{getIntlContent("SOUL.COMMON.CLOSE")}</div>;
            }
          }
        },
        {
          align: "center",
          title: getIntlContent("SOUL.COMMON.OPERAT"),
          dataIndex: "time",
          key: "time",
          ellipsis:true,
          render: (text, record) => {
            return (
              <AuthButton perms="system:plugin:edit">
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
      ]
    })
  }

  render() {
    const { plugin, loading } = this.props;
    const { pluginList, total } = plugin;
    const { currentPage, selectedRowKeys, name, popup } = this.state;
    const columns = this.state.columns.map((col, index) => ({
      ...col,
      onHeaderCell: column => ({
        width: column.width,
        onResize: this.handleResize(index),
      }),
    }));
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange
    };

    return (
      <div className="plug-content-wrap">
        <div style={{ display: "flex" }}>
          <Input
            value={name}
            onChange={this.searchOnchange}
            placeholder={getIntlContent("SOUL.PLUGIN.INPUTNAME")}
            style={{ width: 240 }}
          />
          <AuthButton perms="system:plugin:list">
            <Button
              type="primary"
              style={{ marginLeft: 20 }}
              onClick={this.searchClick}
            >
              {getIntlContent("SOUL.SYSTEM.SEARCH")}
            </Button>
          </AuthButton>
          <AuthButton perms="system:plugin:delete">
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
          <AuthButton perms="system:plugin:add">
            <Button
              style={{ marginLeft: 20 }}
              type="primary"
              onClick={this.addClick}
            >
              {getIntlContent("SOUL.SYSTEM.ADDDATA")}
            </Button>
          </AuthButton>
          <AuthButton perms="system:plugin:modify">
            <Button
              style={{ marginLeft: 20 }}
              icon="reload"
              type="primary"
              onClick={this.syncAllClick}
            >
              {getIntlContent("SOUL.PLUGIN.SYNCALLDATA")}
            </Button>
          </AuthButton>
          <AuthButton perms="system:plugin:disable">
            <Button
              style={{ marginLeft: 20 }}
              type="primary"
              onClick={this.enableClick}
            >
              {getIntlContent("SOUL.PLUGIN.BATCH")}
            </Button>
          </AuthButton>
        </div>

        <Table
          size="small"
          components={this.components}
          style={{ marginTop: 30 }}
          bordered
          loading={loading}
          columns={columns}
          dataSource={pluginList}
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
