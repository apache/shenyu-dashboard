import React, { Component } from "react";
import { Modal,Button, Form, Input, Switch, message} from "antd";
import styles from "./index.less";
import { getIntlContent } from "../../../utils/IntlUtils";

const FormItem = Form.Item;
const { TextArea } = Input;
class AddModal extends Component {
 constructor(props) {
   super(props);
   const selectorConditions = props.authParamVOList || [{
    "appName": "",
    "appParam": ""
  }];
   this.state = {
    selectorConditions,
   }
 }

  handleSubmit = e => {
    const { form, handleOk, id = "" } = this.props;
    const {selectorConditions} = this.state;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        handleOk({ authParamDTOList:selectorConditions,id,...values });
      }
    });
  };

  conditionChange = (index, name, value) => {
    let { selectorConditions } = this.state;
    selectorConditions[index][name] = value;
    this.setState({ selectorConditions });
  };

  handleDelete = index => {
    let { selectorConditions } = this.state;
    if (selectorConditions && selectorConditions.length > 1) {
      selectorConditions.splice(index, 1);
    } else {
      message.destroy();
      message.error("At least one app parameter");
    }
    this.setState({ selectorConditions });
  };

  handleAdd = () => {
    let { selectorConditions } = this.state;
    selectorConditions.push({
      appName: "",
      appParam: ""
    });
    this.setState({ selectorConditions });
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
      enabled = true
    } = this.props;
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
        title={getIntlContent("SHENYU.AUTH.AUTH")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem label={getIntlContent("SHENYU.AUTH.APPID")} {...formItemLayout}>
            {getFieldDecorator("appKey", {
              rules: [{ required: true, message: `${getIntlContent("SHENYU.AUTH.INPUT")}AppKey` }],
              initialValue: appKey
            })(<Input disabled placeholder={`${getIntlContent("SHENYU.AUTH.INPUT")}AppKey`} />)}
          </FormItem>
          <FormItem label={getIntlContent("SHENYU.AUTH.APPPASSWORD")} {...formItemLayout}>
            {getFieldDecorator("appSecret", {
              rules: [{ required: true, message: `${getIntlContent("SHENYU.AUTH.INPUT")}AppSecret` }],
              initialValue: appSecret
            })(<Input disabled placeholder={`${getIntlContent("SHENYU.AUTH.INPUT")}AppSecret`} />)}
          </FormItem>
          <FormItem label={`${getIntlContent("SHENYU.SYSTEM.USER")}Id`} {...formItemLayout}>
            {getFieldDecorator("userId", {
              rules: [{ required: true, message: getIntlContent("SHENYU.AUTH.INPUTUSERID")}],
              initialValue: userId
            })(<Input placeholder={getIntlContent("SHENYU.AUTH.INPUTUSERID")} />)}
          </FormItem>
          <FormItem label={getIntlContent("SHENYU.AUTH.TEL")} {...formItemLayout}>
            {getFieldDecorator("phone", {
              rules: [{ required: true, message: getIntlContent("SHENYU.AUTH.TELPHONE")}],
              initialValue: phone
            })(<Input placeholder={getIntlContent("SHENYU.AUTH.TELPHONE")} />)}
          </FormItem>
          <FormItem label={getIntlContent("SHENYU.AUTH.EXPANDINFO")} {...formItemLayout}>
            {getFieldDecorator("extInfo", {
              rules: [{  message: getIntlContent("SHENYU.AUTH.EXPANDINFO") }],
              initialValue: extInfo
            })(<TextArea placeholder={getIntlContent("SHENYU.AUTH.INPUTEXPANDINFO")} rows={3} />)}
          </FormItem>
          <FormItem label={getIntlContent("SHENYU.AUTH.OPENPATH")} {...formItemLayout}>
            {getFieldDecorator('open', {
              initialValue: open,
              valuePropName: 'checked',
            })(
              <Switch />
            )}
          </FormItem>

          {/* 添加删除行 */}
          <div className={styles.condition}>
            {/* 输入框左侧标题
            <h3 className={styles.header}>
              authParamVOList:{" "}
            </h3> */}
            <div>
              {
                this.state.selectorConditions.map((item,index)=>{
                  return (
                    <ul key={index}>
                      <li>
                        <div className={styles.title}>{getIntlContent("SHENYU.AUTH.APPNAME")}:</div>
                      </li>
                      <li>
                        <Input
                          onChange={e => { this.conditionChange(index,"appName",e.target.value)}}
                          value={item.appName}
                          className={styles.appName}
                        />
                      </li>
                      <li>
                        <div className={styles.title}>{getIntlContent("SHENYU.AUTH.PARAMS")}:</div>
                      </li>
                      <li>
                        <TextArea
                          rows={3}
                          onChange={e => { this.conditionChange( index,"appParam", e.target.value ); }}
                          value={item.appParam}
                          className={styles.appParam}
                        />
                      </li>
                      <li>
                        <Button
                          className={styles.btn}
                          type="danger"
                          onClick={() => {
                            this.handleDelete(index);
                          }}
                        >
                          {getIntlContent( "SHENYU.COMMON.DELETE.NAME")}
                        </Button>
                      </li>
                    </ul>
                  )
                })
              }
            </div>
            <Button onClick={this.handleAdd} className={styles.btn} type="primary">
              {getIntlContent("SHENYU.COMMON.ADD")}
            </Button>
          </div>



          <FormItem {...formItemLayout} label={getIntlContent("SHENYU.SYSTEM.STATUS")}>
            {getFieldDecorator("enabled", {
              initialValue: enabled,
              valuePropName: "checked"
            })(<Switch />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
