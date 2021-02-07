import React, { Component } from "react";
import { Row, Col, Table, Tree, Button, message, Popconfirm, Icon } from "antd";
import { connect } from "dva";
import AddModal from "./AddModal";
import { getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from '../../../utils/AuthButton';
import {resetAuthMenuCache} from '../../../utils/AuthRoute';

const { TreeNode } = Tree;

@connect(({ resource, role, global, loading }) => ({
  resource,
  role,
  global,
  loading: loading.effects["resource/fetchButtons"]
}))
export default class Resource extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      popup: "",
      buttons: [],
      currentMenu: null,
    };
  }

  componentWillMount() {
    this.getMenuTree();
  }

  onSelectChange = selectedRowKeys => {
    this.setState({ selectedRowKeys });
  };

  getMenuTree = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "resource/fetchMenuTree"
    });
  };

  getButtons = (menuId) =>{
    const { dispatch } = this.props;
    dispatch({
      type: "resource/fetchButtons",
      payload: {id: menuId},
      callback: (buttons)=>{
        this.setState({
          buttons
        })
      }
    });
  }

  closeModal = () => {
    this.setState({ popup: "" });
  };

  editClick = record => {
    const { resource: { menuTree }, dispatch } = this.props;
    dispatch({
      type: "resource/fetchItem",
      payload: {
        id: record.id
      },
      callback: resource => {
        this.setState({
          popup: (
            <AddModal
              menuTree={menuTree}
              {...resource}
              handleOk={values => {
                const { icon, sort, parentId, id } = values;
                dispatch({
                  type: "resource/update",
                  payload: {
                    icon,
                    sort,
                    parentId,
                    id
                  },
                  callback: () => {
                    if(resource.resourceType === 2){
                      this.getButtons(resource.parentId);
                    }else{
                      this.getMenuTree();
                    }
                    this.closeModal();
                    this.refreshPermission();
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
  }

  deleteClick = (resourceType, resourceId) => {
    const { dispatch } = this.props;
    const { selectedRowKeys, currentMenu } = this.state;
    if (resourceType === 2 && (!selectedRowKeys || selectedRowKeys.length === 0)) {
      message.destroy();
      message.warn("Please select data");
      return;
    }
    dispatch({
      type: "resource/delete",
      payload: {
        list: resourceType ===2 ? selectedRowKeys : [resourceId]
      },
      callback: () => {
        if(resourceType === 2) {
          this.getButtons(currentMenu.id);
          this.setState({ selectedRowKeys: [] });
        } else {
          this.getMenuTree();
          this.setState({
            buttons: []
          })
        }
      }
    });
  };

  addClick = (resourceType) => {
    const { resource: { menuTree } } = this.props;
    const { currentMenu }  = this.state;
    if(resourceType === 2 && !currentMenu){
      message.warn("请先选择左侧菜单");
      return;
    }
    
    this.setState({
      popup: (
        <AddModal
          resourceType={resourceType}
          menuTree={menuTree}
          handleOk={values => {
            const { dispatch } = this.props;
            const { icon, sort, title, url, perms, parentId} = values;
            dispatch({
              type: "resource/add",
              payload: {
                icon: icon || "",
                sort : isNaN(sort) ? 0: sort,
                title,
                url: url || "",
                parentId: resourceType === 2 ? currentMenu.id : (parentId || ""),
                resourceType,
                name: "",
                component: "",
                isLeaf: resourceType === 2,
                isRoute: 0,
                perms: perms || "",
                status: 1
              },
              callback: () => {
                if(resourceType === 2){
                  this.getButtons(currentMenu.id);
                }else{
                  this.getMenuTree();
                }
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

  refreshPermission = () => {
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

  onSelectMenu = (selectedKeys, e) => {
    const currentMenu = e.node.props.dataRef;
    if(currentMenu.children && currentMenu.children.length > 0){
      this.setState({
        currentMenu,
        buttons: []
      })
    }else {
      this.getButtons(currentMenu.id);
      this.setState({
        currentMenu
      })
    }
  }

  renderTreeNodes = (data) => {
    data = data.sort((a,b)=>(a.sort||0)-(b.sort||0));
    return data.map(item => {
      const { currentMenu } = this.state;
      item.title =  item.meta.title;
      if (item.title.startsWith("SOUL.")) {
        item.title = getIntlContent(item.title);
      }
      if (item.children && item.children.length > 0) {
        if(currentMenu && item.id === currentMenu.id){
          return (
            <TreeNode
              title={
                <div style={{width:"200px",display:"flex",justifyContent:"space-between"}}>
                  <span>{item.meta.icon&&<span style={{width:"24px",height:"24px",lineHeight:"24px",margin:"0 5px"}}><Icon type={item.meta.icon} /></span>}{item.title}</span>
                  <span>
                    <Icon 
                      onClick={(e)=>{
                        e.stopPropagation();
                        this.editClick(item);
                      }} 
                      type="edit" 
                    />
                  </span>
                </div>
              } 
              key={item.id} 
              dataRef={item}
            >
              {this.renderTreeNodes(item.children)}
            </TreeNode>
          );
        }else{
          return (
            <TreeNode title={item.title} icon={item.meta.icon&&<Icon type={item.meta.icon} />} key={item.id} dataRef={item}>
              {this.renderTreeNodes(item.children)}
            </TreeNode>
          );
        }
      }
      if(!currentMenu || item.id !== currentMenu.id){
        return <TreeNode icon={item.meta.icon&&<Icon type={item.meta.icon} />} title={item.title} key={item.id} dataRef={item} />;
      } else {
        return (
          <TreeNode
            title={
              <div style={{width:"200px",display:"flex",justifyContent:"space-between"}}>
                <span>{item.meta.icon&&<span style={{width:"24px",height:"24px",lineHeight:"24px",margin:"0 5px"}}><Icon type={item.meta.icon} /></span>}{item.title}</span>
                <span>
                  <AuthButton perms="system:resource:editMenu">
                    <Icon
                      onClick={(e)=>{
                        e.stopPropagation();
                        this.editClick(item);
                      }} 
                      type="edit" 
                    />
                  </AuthButton>
                  {!item.url.startsWith("/plug/") && (
                    <AuthButton perms="system:resource:editMenu">
                      <Popconfirm
                        title={getIntlContent("SOUL.COMMON.DELETE")}
                        placement='bottom'
                        onConfirm={(e) => {
                          e.stopPropagation();
                          this.deleteClick(item.resourceType, item.id);
                        }}
                        okText={getIntlContent("SOUL.COMMON.SURE")}
                        cancelText={getIntlContent("SOUL.COMMON.CALCEL")}
                      >
                        <Icon 
                          style={{marginLeft:10}}
                          onClick={(e)=>{
                            e.stopPropagation();
                          }} 
                          type="delete" 
                        />
                      </Popconfirm>
                    </AuthButton>
                  )}
                </span>
              </div>
            } 
            key={item.id} 
            dataRef={item}
          />
        );
      }
    });
  }
    

  render() {
    const { resource: { menuTree }, loading } = this.props;
    const { selectedRowKeys, buttons, popup } = this.state;
    const buttonColumns = [
      {
        align: "center",
        title: getIntlContent("SOUL.SYSTEM.BUTTON"),
        dataIndex: "title",
        key: "title",
        ellipsis:true,
        render: text => {
          return  getIntlContent(text) || text;
        }
      },
      {
        align: "center",
        title: getIntlContent("SOUL.SYSTEM.ICON"),
        dataIndex: "icon",
        key: "icon",
        render: text => {
          return  <Icon type={text} /> || text;
        }
      },
      {
        align: "center",
        title: getIntlContent("SOUL.SYSTEM.RESOURCE.PERMS"),
        dataIndex: "perms",
        key: "perms",
        ellipsis:true
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
            <AuthButton perms="system:resource:editButton">
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
        <Row gutter={20}>
          <Col span={6} style={{minWidth:280}}>
            <div className="table-header">
              <h3>{getIntlContent("SOUL.SYSTEM.RESOURCE.MENULIST.TITLE")}</h3>
              <AuthButton perms="system:resource:addMenu">
                <Button type="primary" onClick={() => this.addClick(1)}>
                  {getIntlContent("SOUL.BUTTON.RESOURCE.MENU.ADD")}
                </Button>
              </AuthButton>
            </div>
            {(menuTree && menuTree.length > 0) ? (
              <Tree
                style={{background:"white",marginTop: 30}}
                defaultExpandAll
                onSelect={this.onSelectMenu}
                showIcon
              >
                {this.renderTreeNodes(menuTree)}
              </Tree>
          ):null}
          </Col>
          <Col span={18}>
            <div className="table-header">
              <div style={{ display: "flex" }}>
                <h3 style={{ marginRight: 30 }}>{getIntlContent("SOUL.SYSTEM.RESOURCE.BUTTONLIST.TITLE")}</h3>
                <AuthButton perms="system:resource:deleteButton">
                  <Popconfirm
                    title={getIntlContent("SOUL.COMMON.DELETE")}
                    placement='bottom'
                    onConfirm={() => {
                      this.deleteClick(2)
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
              </div>
              <AuthButton perms="system:resource:addButton">
                <Button onClick={() => this.addClick(2)} type="primary">
                  {getIntlContent("SOUL.BUTTON.RESOURCE.BUTTON.ADD")}
                </Button>
              </AuthButton>
            </div>
            <Table
              style={{marginTop: 30}}
              size="small"
              bordered
              rowKey="id"
              loading={loading}
              columns={buttonColumns}
              dataSource={buttons}
              rowSelection={rowSelection}
              pagination={false}
            />
          </Col>
        </Row>
        {popup}
      </div>
    );
  }
}
