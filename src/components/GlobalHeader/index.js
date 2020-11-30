import React, { PureComponent } from 'react';
import { Dropdown, Icon,  Select, Menu, Button} from 'antd';
import { TranslationOutlined } from '@ant-design/icons'
import styles from './index.less';
import { getIntlContent } from '../../utils/IntlUtils'
import { emit } from '../../utils/emit';

const { Option } = Select;

export default class GlobalHeader extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      localeName: '',
      menu: (
        <Menu onClick={this.handleLocalesValueChange}>
          <Menu.Item key='0'>
            <span>English</span>
          </Menu.Item>
          <Menu.Item key='1'>
            <span>中文</span>
          </Menu.Item>
        </Menu>
      )
    }
  }
  changeLocales(locale) {
    this.setState({
      localeName: locale
    })
  }

  handleLocalesValueChange = value => {
    if (value.key === '0') {
      emit.emit('change_language', 'en-US');
      window.sessionStorage.setItem('locale', 'en-US');
    } else {
      emit.emit('change_language', 'zh-CN');
      window.sessionStorage.setItem('locale', 'zh-CN');
    }
    this.changeLocales(value);
  }
  render() {
   const { onLogout } = this.props;
    return (
      <div className={styles.header}>
        <Dropdown placement="bottomCenter" overlay={this.state.menu} trigger={['click']}>
          <TranslationOutlined />
        </Dropdown>
        <div className={styles.right} onClick={onLogout}>
          <Icon type="logout" /> {getIntlContent("SOUL.GLOBALHEADER.LOGOUT")}
        </div>
      </div>
    );
  }
}
