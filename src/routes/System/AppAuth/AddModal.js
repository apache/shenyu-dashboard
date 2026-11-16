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

import React, { Component } from "react";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Table from "@douyinfe/semi-ui/lib/es/table";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import Modal from "../../../components/ui/Modal";
import Form from "../../../components/ui/Form";
import Input from "../../../components/ui/Input";
import Switch from "../../../components/ui/Switch";
import { message } from "../../../components/ui/feedback";
import styles from "./index.module.less";
import { getIntlContent } from "../../../utils/IntlUtils";

const FormItem = Form.Item;
const { TextArea } = Input;
class AddModal extends Component {
  constructor(props) {
    super(props);
    const selectorConditions = (
      props.authParamList || [
        {
          appName: "",
          appParam: "",
        },
      ]
    ).map((item) => ({ ...item }));
    const pathDatas = (
      props.authPathList || [
        {
          path: "",
          enabled: true,
        },
      ]
    ).map((item, index) => ({ ...item, clientKey: index }));
    this.nextPathKey = pathDatas.length;
    this.columns = [
      {
        title: getIntlContent("SHENYU.AUTH.RESOUCE.PATH"),
        dataIndex: "path",
        editable: "true",
        render: (text, record) => (
          <Input
            allowClear
            placeholder="/"
            value={text}
            onChange={(e) =>
              this.handleTableInput(e.target.value, record.clientKey)
            }
          />
        ),
      },
      {
        title: getIntlContent("SHENYU.COMMON.OPERAT"),
        dataIndex: "operation",
        render: (text, record) =>
          this.state.pathDatas.length > 1 ? (
            <Popconfirm
              title={getIntlContent("SHENYU.COMMON.DELETE")}
              motion={false}
              okText={getIntlContent("SHENYU.COMMON.SURE")}
              cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
              onConfirm={() => this.handleDeletePath(record.clientKey)}
            >
              <Button htmlType="button" theme="borderless" type="danger">
                {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
              </Button>
            </Popconfirm>
          ) : null,
      },
    ];
    this.state = {
      selectorConditions,
      pathTableVisible: props.open !== false,
      pagination: 1,
      pathDatas,
    };
  }

  handleSubmit = (e) => {
    const { form, handleOk, id = "" } = this.props;
    const { selectorConditions } = this.state;
    const { pathDatas } = this.state;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        handleOk({
          authParamList: selectorConditions,
          authPathList: pathDatas.map(({ clientKey, ...path }) => path),
          id,
          ...values,
        });
      }
    });
  };

  conditionChange = (index, name, value) => {
    this.setState(({ selectorConditions }) => ({
      selectorConditions: selectorConditions.map((item, position) =>
        position === index ? { ...item, [name]: value } : item,
      ),
    }));
  };

  handleDelete = (index) => {
    if (this.state.selectorConditions.length <= 1) {
      message.destroy();
      message.error("At least one app parameter");
      return;
    }
    this.setState(({ selectorConditions }) => ({
      selectorConditions: selectorConditions.filter(
        (item, position) => position !== index,
      ),
    }));
  };

  handleAdd = () => {
    this.setState(({ selectorConditions }) => ({
      selectorConditions: [
        ...selectorConditions,
        { appName: "", appParam: "" },
      ],
    }));
  };

  handleOpenChange = (checked) => {
    this.setState({ pathTableVisible: checked });
  };

  handleAddPath = () => {
    const newData = { path: "", enabled: true, clientKey: this.nextPathKey };
    this.nextPathKey += 1;
    this.setState(({ pathDatas }) => ({ pathDatas: [...pathDatas, newData] }));
  };

  handleDeletePath = (key) => {
    if (this.state.pathDatas.length <= 1) {
      message.destroy();
      message.error("At least one app path");
      return;
    }
    this.setState(({ pathDatas, pagination }) => {
      const remaining = pathDatas.filter((item) => item.clientKey !== key);
      return {
        pathDatas: remaining,
        pagination: Math.min(
          pagination,
          Math.max(1, Math.ceil(remaining.length / 10)),
        ),
      };
    });
  };

  handleTableInput = (value, key) => {
    this.setState(({ pathDatas }) => ({
      pathDatas: pathDatas.map((item) =>
        item.clientKey === key ? { ...item, path: value } : item,
      ),
    }));
  };

  handleTableChange = (paginationObj) => {
    this.setState({
      pagination: paginationObj.current,
    });
  };

  render() {
    let {
      handleCancel,
      form,
      appKey = "",
      appSecret = "",
      userId,
      phone,
      extInfo,
      open = true,
      enabled = true,
    } = this.props;
    const { getFieldDecorator } = form;
    const { pathTableVisible } = this.state;
    const columns = this.columns;
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
        title={getIntlContent("SHENYU.AUTH.AUTH")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label={getIntlContent("SHENYU.AUTH.APPID")}
            {...formItemLayout}
          >
            {getFieldDecorator("appKey", {
              rules: [
                {
                  required: true,
                  message: `${getIntlContent("SHENYU.AUTH.INPUT")}AppKey`,
                },
              ],
              initialValue: appKey,
            })(
              <Input
                allowClear
                disabled
                placeholder={`${getIntlContent("SHENYU.AUTH.INPUT")}AppKey`}
              />,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.AUTH.APPPASSWORD")}
            {...formItemLayout}
          >
            {getFieldDecorator("appSecret", {
              rules: [
                {
                  required: true,
                  message: `${getIntlContent("SHENYU.AUTH.INPUT")}AppSecret`,
                },
              ],
              initialValue: appSecret,
            })(
              <Input
                allowClear
                disabled
                placeholder={`${getIntlContent("SHENYU.AUTH.INPUT")}AppSecret`}
              />,
            )}
          </FormItem>
          <FormItem
            label={`${getIntlContent("SHENYU.SYSTEM.USER")}Id`}
            {...formItemLayout}
          >
            {getFieldDecorator("userId", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.AUTH.INPUTUSERID"),
                },
              ],
              initialValue: userId,
            })(
              <Input
                allowClear
                placeholder={getIntlContent("SHENYU.AUTH.INPUTUSERID")}
              />,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.AUTH.TEL")}
            {...formItemLayout}
          >
            {getFieldDecorator("phone", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.AUTH.TELPHONE"),
                },
              ],
              initialValue: phone,
            })(
              <Input
                allowClear
                placeholder={getIntlContent("SHENYU.AUTH.TELPHONE")}
              />,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.AUTH.EXPANDINFO")}
            {...formItemLayout}
          >
            {getFieldDecorator("extInfo", {
              rules: [{ message: getIntlContent("SHENYU.AUTH.EXPANDINFO") }],
              initialValue: extInfo,
            })(
              <TextArea
                placeholder={getIntlContent("SHENYU.AUTH.INPUTEXPANDINFO")}
                rows={3}
              />,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.AUTH.OPENPATH")}
            {...formItemLayout}
          >
            {getFieldDecorator("open", {
              initialValue: open,
              valuePropName: "checked",
            })(<Switch onChange={this.handleOpenChange} />)}
          </FormItem>

          {/* 添加删除行 */}
          <div className={styles.condition}>
            {/* 输入框左侧标题
            <h3 className={styles.header}>
              authParamVOList:{" "}
            </h3> */}
            <div>
              {this.state.selectorConditions.map((item, index) => {
                return (
                  <ul key={index}>
                    <li>
                      <div className={styles.title}>
                        {getIntlContent("SHENYU.AUTH.APPNAME")}:
                      </div>
                    </li>
                    <li>
                      <Input
                        allowClear
                        onChange={(e) => {
                          this.conditionChange(
                            index,
                            "appName",
                            e.target.value,
                          );
                        }}
                        value={item.appName}
                        className={styles.appName}
                      />
                    </li>
                    <li>
                      <div className={styles.title}>
                        {getIntlContent("SHENYU.AUTH.PARAMS")}:
                      </div>
                    </li>
                    <li>
                      <TextArea
                        rows={3}
                        onChange={(e) => {
                          this.conditionChange(
                            index,
                            "appParam",
                            e.target.value,
                          );
                        }}
                        value={item.appParam}
                        className={styles.appParam}
                      />
                    </li>
                    <li>
                      <Button
                        htmlType="button"
                        className={styles.btn}
                        type="danger"
                        onClick={() => {
                          this.handleDelete(index);
                        }}
                      >
                        {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                      </Button>
                    </li>
                  </ul>
                );
              })}
            </div>
            <Button
              htmlType="button"
              onClick={this.handleAdd}
              className={styles.btn}
              type="primary"
              theme="solid"
            >
              {getIntlContent("SHENYU.COMMON.ADD")}
            </Button>
          </div>

          <FormItem
            {...formItemLayout}
            label={getIntlContent("SHENYU.SYSTEM.STATUS")}
          >
            {getFieldDecorator("enabled", {
              initialValue: enabled,
              valuePropName: "checked",
            })(<Switch />)}
          </FormItem>

          {pathTableVisible && (
            <div>
              <Button
                htmlType="button"
                onClick={this.handleAddPath}
                type="primary"
                theme="solid"
                style={{
                  marginBottom: 16,
                }}
              >
                {getIntlContent("SHENYU.AUTH.ADD")}
              </Button>
              <Table
                bordered
                columns={columns}
                dataSource={this.state.pathDatas}
                rowKey="clientKey"
                pagination={{
                  currentPage: this.state.pagination,
                  pageSize: 10,
                  onChange: (page) => this.handleTableChange({ current: page }),
                }}
              />
            </div>
          )}
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
