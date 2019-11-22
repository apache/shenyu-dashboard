import React from "react";
import { Form, Input, Button } from 'antd';

class InlineSearch extends React.Component {

  handleSubmit = e => {
    e.preventDefault();
    const searchCont= this.props.form.getFieldsValue()
    this.props.onClick(searchCont)
    // console.log(searchCont)
    
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <Form layout="inline" onSubmit={this.handleSubmit}>
        <Form.Item>
          {getFieldDecorator('appKey', {
              initialValue:null
          })(
            <Input
              placeholder="请输入appKey"
            />,
          )}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('phone', {
              initialValue:null
          })(
            <Input
              type="phone"
              placeholder="请输入手机号码"
            />,
          )}
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            查询
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
const SearchContent = Form.create({})(InlineSearch);
export default SearchContent
