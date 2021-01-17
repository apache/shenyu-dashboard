import React, { PureComponent } from 'react';
import { Dropdown, Icon, Menu } from 'antd';
import { TranslationOutlined } from '@ant-design/icons'
import styles from './index.less';
import { getIntlContent, getCurrentLocale } from '../../utils/IntlUtils'
import { emit } from '../../utils/emit';

export default class GlobalHeader extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      menu: (
        <Menu onClick={this.handleLocalesValueChange}>
          <Menu.Item key='0'>
            <span>English</span>
          </Menu.Item>
          <Menu.Item key='1'>
            <span>中文</span>
          </Menu.Item>
        </Menu>
      ),
      localeName: window.sessionStorage.getItem('locale') ? window.sessionStorage.getItem('locale') : 'en-US',
      userName: window.sessionStorage.getItem('userName')
    }
  }

  handleLocalesValueChange = value => {
    const { changeLocalName } = this.props;
    if (value.key === '0') {
      emit.emit('change_language', 'en-US');
      window.sessionStorage.setItem('locale', 'en-US');
      this.setState({
        localeName: 'en-Us'
      });
      changeLocalName('en-Us');
    } else {
      emit.emit('change_language', 'zh-CN');
      window.sessionStorage.setItem('locale', 'zh-CN');
      this.setState({
        localeName: 'zh-CN'
      });
      changeLocalName('zh-CN');
    }
    getCurrentLocale(this.state.localeName);
  }

  render() {
    const { onLogout } = this.props;
    const { userName } = this.state;
    const menu = (
      <Menu>
        <Menu.Item key="0" onClick={onLogout}>
          <Icon type="logout" /> {getIntlContent("SOUL.GLOBALHEADER.LOGOUT")}
        </Menu.Item>
      </Menu>
    );
    return (
      <div className={styles.header}>
        <Dropdown placement="bottomCenter" overlay={this.state.menu} trigger={['click']}>
          <TranslationOutlined />
        </Dropdown>
        <div className={styles.right}>
          <Dropdown overlay={menu}>
            <span>
              <Icon type="user" />{userName}<Icon type="down" />
            </span>
          </Dropdown> 
        </div>
      </div>
    );
  }
}
