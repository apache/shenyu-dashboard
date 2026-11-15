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

import React, { PureComponent } from "react";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Dropdown from "@douyinfe/semi-ui/lib/es/dropdown";
import { connect } from "react-redux";
import Form from "../ui/Form";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import ResourceIcon from "../ui/ResourceIcon";
import { withRouter } from "../../runtime/router";
import ImportModal from "./ImportModal";
import ExportModal from "./ExportModal";
import ImportResultModal from "./ImportResultModal";
import parseImportResult from "./parseImportResult";
import styles from "./index.less";
import { getCurrentLocale, getIntlContent } from "../../utils/IntlUtils";
import { checkUserPassword } from "../../services/api";
import { emit } from "../../utils/emit";
import { resetAuthMenuCache } from "../../utils/AuthRoute";
import { defaultNamespaceId } from "../_utils/utils";

const TranslationOutlinedSvg = () => (
  <svg
    viewBox="64 64 896 896"
    data-icon="translation"
    width="1em"
    height="1em"
    fill="currentColor"
    aria-hidden="true"
  >
    <defs>
      <style />
    </defs>
    <path d="M140 188h584v164h76V144c0-17.7-14.3-32-32-32H96c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h544v-76H140V188z" />
    <path d="M414.3 256h-60.6c-3.4 0-6.4 2.2-7.6 5.4L219 629.4c-.3.8-.4 1.7-.4 2.6 0 4.4 3.6 8 8 8h55.1c3.4 0 6.4-2.2 7.6-5.4L322 540h196.2L422 261.4a8.42 8.42 0 00-7.7-5.4zm12.4 228h-85.5L384 360.2 426.7 484zM936 528H800v-93c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v93H592c-13.3 0-24 10.7-24 24v176c0 13.3 10.7 24 24 24h136v152c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V752h136c13.3 0 24-10.7 24-24V552c0-13.3-10.7-24-24-24zM728 680h-88v-80h88v80zm160 0h-88v-80h88v80z" />
  </svg>
);

@connect(({ global, manage, loading }) => ({
  manage,
  permissions: global.permissions,
  namespaces: global.namespaces,
  currentNamespaceId: global.currentNamespaceId,
  loading: loading.effects["manage/update"],
}))
@Form.create({})
class GlobalHeader extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      help: (
        <Dropdown.Menu>
          <Dropdown.Item>
            <span>
              <a
                href="https://shenyu.apache.org"
                target="_blank"
                rel="noreferrer"
              >
                Website
              </a>
            </span>
          </Dropdown.Item>
          <Dropdown.Item>
            <span>
              <a
                href="https://github.com/apache/shenyu"
                target="_blank"
                rel="noreferrer"
              >
                Github
              </a>
            </span>
          </Dropdown.Item>
        </Dropdown.Menu>
      ),
      menu: (
        <Dropdown.Menu>
          <Dropdown.Item
            key="0"
            onClick={() => this.handleLocalesValueChange({ key: "0" })}
          >
            <span>English</span>
          </Dropdown.Item>
          <Dropdown.Item
            key="1"
            onClick={() => this.handleLocalesValueChange({ key: "1" })}
          >
            <span>中文</span>
          </Dropdown.Item>
        </Dropdown.Menu>
      ),
      localeName: window.sessionStorage.getItem("locale")
        ? window.sessionStorage.getItem("locale")
        : "en-US",
      userName: window.sessionStorage.getItem("userName"),
      visible: false,
      display: "none",
      popup: "",
    };
  }

  componentDidMount() {
    const token = window.sessionStorage.getItem("token");
    if (token) {
      checkUserPassword().then((res) => {
        if (res && res.code !== 200) {
          this.setState({ visible: true, display: "block" });
        }
      });
      this.fetchNamespaces();
    }
  }

  componentWillUnmount() {
    this.setState = () => false;
  }

  fetchNamespaces = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "global/fetchNamespaces",
    });
  };

  handleLocalesValueChange = (value) => {
    const { changeLocalName } = this.props;
    if (value.key === "0") {
      emit.emit("change_language", "en-US");
      window.sessionStorage.setItem("locale", "en-US");
      this.setState({
        localeName: "en-US",
      });
      changeLocalName("en-US");
    } else {
      emit.emit("change_language", "zh-CN");
      window.sessionStorage.setItem("locale", "zh-CN");
      this.setState({
        localeName: "zh-CN",
      });
      changeLocalName("zh-CN");
    }
    getCurrentLocale(this.state.localeName);
  };

  handleNamespacesValueChange = (value) => {
    const { dispatch } = this.props;
    const namespaceId =
      value?.key ||
      window.sessionStorage.getItem("currentNamespaceId") ||
      defaultNamespaceId;
    dispatch({
      type: "global/saveCurrentNamespaceId",
      payload: namespaceId,
    });
    // Fetch plugins for the new namespace
    dispatch({
      type: "global/fetchPlugins",
      payload: {},
    });
    dispatch({
      type: "global/fetchPermission",
      payload: {
        namespaceId,
        callback: () => {
          resetAuthMenuCache();
        },
      },
    });
  };

  importConfigClick = () => {
    this.setState({
      popup: (
        <ImportModal
          disabled={false}
          handleOk={(values) => {
            const { dispatch } = this.props;
            dispatch({
              type: "common/import",
              payload: values,
              callback: (res) => {
                this.closeModal(true);
                const importResult = parseImportResult(res);
                if (importResult) {
                  this.showImportRestlt(importResult);
                }
              },
            });
          }}
          handleCancel={() => {
            this.closeModal();
          }}
        />
      ),
    });
  };

  showImportRestlt = (json) => {
    this.setState({
      popup: (
        <ImportResultModal
          disabled={false}
          json={json}
          title={getIntlContent("SHENYU.COMMON.IMPORT.RESULT")}
          onCancel={() => this.closeModal(true)}
          onOk={() => this.closeModal(true)}
        />
      ),
    });
  };

  closeModal = (refresh) => {
    if (refresh) {
      this.setState({ popup: "" }, this.query);
    }
    this.setState({ popup: "" });
  };

  // export configs
  exportConfigClick = () => {
    this.setState({
      popup: (
        <ExportModal
          disabled={false}
          handleOk={(values) => {
            const { dispatch } = this.props;
            dispatch({
              type: "common/exportByNamespace",
              payload: values,
              callback: () => {
                this.closeModal(true);
              },
            });
          }}
          handleCancel={() => {
            this.closeModal();
          }}
        />
      ),
    });
    // const { dispatch } = this.props;
    // dispatch({
    //   type: "common/exportAll",
    // });
  };

  checkAuth = (perms) => {
    const { permissions } = this.props;
    return (
      (permissions.button ?? []).filter((item) => {
        return item.perms === perms;
      }).length > 0
    );
  };

  render() {
    const {
      onLogout,
      form: { getFieldDecorator, resetFields, validateFields, getFieldValue },
      dispatch,
      loading,
      namespaces,
      currentNamespaceId,
      location: { pathname },
    } = this.props;
    const { popup, userName, visible } = this.state;
    const showNamespaces = !~[
      "/config/dict",
      "/config/namespace",
      "/config/pluginhandle",
      "/config/plugin",
      "/system/resource",
      "/system/role",
      "/system/manage",
    ].indexOf(pathname);
    const menu = (
      <Dropdown.Menu>
        <Dropdown.Item
          key="1"
          onClick={() => {
            this.setState({ visible: true });
          }}
        >
          <ResourceIcon type="form" />{" "}
          {getIntlContent("SHENYU.GLOBALHEADER.CHANGE.PASSWORD")}
        </Dropdown.Item>
        <Dropdown.Item key="0" onClick={onLogout}>
          <ResourceIcon type="logout" />{" "}
          {getIntlContent("SHENYU.GLOBALHEADER.LOGOUT")}
        </Dropdown.Item>
      </Dropdown.Menu>
    );
    const importMenu = (
      <Dropdown.Menu>
        {this.checkAuth("system:manager:exportConfig") && (
          <Dropdown.Item key="2" onClick={this.exportConfigClick}>
            <ResourceIcon type="export" />{" "}
            {getIntlContent("SHENYU.COMMON.EXPORT")}
          </Dropdown.Item>
        )}
        {this.checkAuth("system:manager:importConfig") && (
          <Dropdown.Item key="3" onClick={this.importConfigClick}>
            <ResourceIcon type="import" />{" "}
            {getIntlContent("SHENYU.COMMON.IMPORT")}
          </Dropdown.Item>
        )}
      </Dropdown.Menu>
    );
    return (
      <div className={styles.header}>
        <div className={styles.brand}>
          <Button
            theme="borderless"
            aria-label="Toggle navigation"
            icon={
              <ResourceIcon
                type={this.props.collapsed ? "menu-unfold" : "menu-fold"}
              />
            }
            onClick={() => this.props.onCollapse?.(!this.props.collapsed)}
          />
          <span className={styles.text}>
            Apache ShenYu Gateway Management System
          </span>
        </div>
        <div className={styles.controls}>
          {showNamespaces && (
            <div className={styles.item}>
              <Dropdown
                trigger="click"
                position="bottom"
                render={
                  <Dropdown.Menu>
                    {namespaces.map((namespace) => {
                      let isCurrentNamespace =
                        currentNamespaceId === namespace.namespaceId;
                      return (
                        <Dropdown.Item
                          key={namespace.namespaceId}
                          onClick={() =>
                            this.handleNamespacesValueChange({
                              key: namespace.namespaceId,
                            })
                          }
                          disabled={isCurrentNamespace}
                        >
                          <span>{namespace.name}</span>
                        </Dropdown.Item>
                      );
                    })}
                  </Dropdown.Menu>
                }
              >
                <Button>
                  <span
                    className={styles.namespaceName}
                    style={{ fontWeight: "bold" }}
                    onClick={(e) => e.preventDefault()}
                  >
                    {`${getIntlContent("SHENYU.SYSTEM.NAMESPACE")} / ${namespaces.find((namespace) => currentNamespaceId === namespace.namespaceId)?.name} `}
                  </span>
                  <ResourceIcon type="down" />
                </Button>
              </Dropdown>
            </div>
          )}
          {(this.checkAuth("system:manager:importConfig") ||
            this.checkAuth("system:manager:exportConfig")) && (
            <div className={styles.item}>
              <Dropdown trigger="click" render={importMenu}>
                <Button>
                  <ResourceIcon type="import" />{" "}
                  {getIntlContent("SHENYU.COMMON.IMPORT_EXPORT")}
                </Button>
              </Dropdown>
            </div>
          )}
          <div className={styles.item}>
            <Dropdown
              trigger="click"
              position="bottom"
              render={this.state.help}
            >
              <Button aria-label="Help">
                <ResourceIcon type="question-circle" />
              </Button>
            </Dropdown>
          </div>
          <div className={styles.item}>
            <Dropdown
              trigger="click"
              position="bottom"
              render={this.state.menu}
            >
              <Button aria-label="Language">
                <TranslationOutlinedSvg />
              </Button>
            </Dropdown>
          </div>
          <div className={`${styles.item} ${styles.right}`}>
            <Dropdown trigger="click" render={menu}>
              <Button icon={<ResourceIcon type="user" />}>
                <span>{userName}</span>
              </Button>
            </Dropdown>
          </div>
        </div>
        <Modal
          width="40%"
          title={getIntlContent("SHENYU.GLOBALHEADER.CHANGE.PASSWORD")}
          visible={visible}
          keepDOM
          okText={getIntlContent("SHENYU.COMMON.SURE")}
          cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
          okButtonProps={{
            loading,
          }}
          onCancel={() => {
            this.setState({ visible: false, display: "none" });
            resetFields();
          }}
          onOk={() => {
            validateFields((errors, values) => {
              if (!errors) {
                dispatch({
                  type: "manage/updatePassword",
                  payload: {
                    id: window.sessionStorage.getItem("userId"),
                    userName: window.sessionStorage.getItem("userName"),
                    password: values.password,
                    oldPassword: values.oldPassword,
                  },
                  callback: () => {
                    this.setState({ visible: false, display: "none" });
                    resetFields();
                    onLogout();
                  },
                });
              }
            });
          }}
        >
          <div
            className={styles.warning}
            style={{
              display: this.state.display,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {getIntlContent("SHENYU.SYSTEM.USER.CHANGEPASSWORD")}
          </div>

          <Form labelCol={{ span: 8 }} wrapperCol={{ span: 14 }}>
            <Form.Item
              required
              label={getIntlContent("SHENYU.GLOBALHEADER.OLD.PASSWORD")}
            >
              {getFieldDecorator("oldPassword", {
                rules: [
                  {
                    validator(rule, value, callback) {
                      if (!value || value.length === 0) {
                        callback(getIntlContent("SHENYU.GLOBALHEADER.NOTNULL"));
                        return;
                      }
                      callback();
                    },
                  },
                ],
              })(<Input.Password allowClear />)}
            </Form.Item>
            <Form.Item
              required
              label={getIntlContent("SHENYU.GLOBALHEADER.NEW.PASSWORD")}
              extra={getIntlContent("SHENYU.GLOBALHEADER.PASSWORD.EXTRA")}
            >
              {getFieldDecorator("password", {
                rules: [
                  {
                    validator(rule, value, callback) {
                      if (!value) {
                        callback(
                          getIntlContent(
                            "SHENYU.GLOBALHEADER.PASSWORD.REQUIRED",
                          ),
                        );
                        return;
                      }
                      if (value.length < 8 || value.length > 16) {
                        callback(
                          getIntlContent("SHENYU.GLOBALHEADER.PASSWORD.LENGTH"),
                        );
                        return;
                      }
                      if (
                        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.=_+-])[A-Za-z\d@$!%*?&#.=_+-]{8,}$/.test(
                          value,
                        )
                      ) {
                        callback(
                          getIntlContent("SHENYU.GLOBALHEADER.PASSWORD.RULE"),
                        );
                        return;
                      }
                      callback();
                    },
                  },
                ],
              })(<Input.Password allowClear />)}
            </Form.Item>
            <Form.Item
              label={getIntlContent("SHENYU.GLOBALHEADER.CONFIRM.PASSWORD")}
              required
            >
              {getFieldDecorator("confirmPassword", {
                rules: [
                  {
                    validator(rule, value, callback) {
                      const password = getFieldValue("password");
                      if (!value) {
                        callback(
                          getIntlContent(
                            "SHENYU.GLOBALHEADER.CONFIRM.PASSWORD.REQUIRED",
                          ),
                        );
                        return;
                      }
                      if (password !== value) {
                        callback(
                          getIntlContent(
                            "SHENYU.GLOBALHEADER.CONFIRM.PASSWORD.RULE",
                          ),
                        );
                        return;
                      }
                      callback();
                    },
                  },
                ],
              })(<Input.Password allowClear />)}
            </Form.Item>
          </Form>
        </Modal>
        {popup}
      </div>
    );
  }
}

export default withRouter(GlobalHeader);
