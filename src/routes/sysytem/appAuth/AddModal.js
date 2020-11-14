import React, { Component } from "react";
import { Modal,Button, Form, Input, Switch, message} from "antd";
import styles from "./index.less";

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
      message.error("至少有一个条件");
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
    // console.log("**********")
    // console.log(this.props)
    let {
      handleCancel,
      form,
      appKey = "",
      appSecret = "",
      userId,
      phone,
      extInfo,
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
        title="认证"
        visible
        okText="确定"
        cancelText="取消"
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem label="appKey" {...formItemLayout}>
            {getFieldDecorator("appKey", {
              rules: [{ required: true, message: "请输入appKey" }],
              initialValue: appKey
            })(<Input placeholder="appKey" />)}
          </FormItem>
          <FormItem label="appSecret" {...formItemLayout}>
            {getFieldDecorator("appSecret", {
              rules: [{ required: true, message: "请输入appSecret" }],
              initialValue: appSecret
            })(<Input placeholder="appSecret" />)}
          </FormItem>
          <FormItem label="userId" {...formItemLayout}>
            {getFieldDecorator("userId", {
              rules: [{ required: true, message: "请输入userId" }],
              initialValue: userId
            })(<Input placeholder="userId" />)}
          </FormItem>
          <FormItem label="phone" {...formItemLayout}>
            {getFieldDecorator("phone", {
              rules: [{ required: true, message: "请输入phone" }],
              initialValue: phone
            })(<Input placeholder="phone" />)}
          </FormItem>
          <FormItem label="extInfo" {...formItemLayout}>
            {getFieldDecorator("extInfo", {
              rules: [{  message: "请输入extInfo" }],
              initialValue: extInfo
            })(<TextArea placeholder="extInfo" rows={3} />)}
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
                        <div className={styles.title}>appName:</div>
                      </li>
                      <li>
                        <Input 
                          onChange={e => { this.conditionChange(index,"appName",e.target.value)}} 
                          value={item.appName}
                          className={styles.appName}
                        />
                      </li>
                      <li>
                        <div className={styles.title}>appParam:</div>
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
                          删除
                        </Button>
                      </li>
                    </ul>
                  )
                })
              }
            </div>
            <Button onClick={this.handleAdd} className={styles.btn} type="primary">
              新增
            </Button>
          </div>



          <FormItem {...formItemLayout} label="状态">
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
