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
import { Button, Spin, Card } from "antd";
import { connect } from "dva";
import PropTypes from "prop-types";
import styles from "./style.less";

@connect(({ loading }) => ({
  isloading: !!loading.effects["error/query"],
}))
export default class TriggerException extends PureComponent {
  triggerError = (code) => {
    const { dispatch } = this.props;
    dispatch({
      type: "error/query",
      payload: {
        code,
      },
    });
  };

  render() {
    const { isloading } = this.props;
    return (
      <Card>
        <Spin spinning={isloading} wrapperClassName={styles.trigger}>
          <Button type="danger" onClick={() => this.triggerError(401)}>
            触发401
          </Button>
          <Button type="danger" onClick={() => this.triggerError(403)}>
            触发403
          </Button>
          <Button type="danger" onClick={() => this.triggerError(500)}>
            触发500
          </Button>
          <Button type="danger" onClick={() => this.triggerError(404)}>
            触发404
          </Button>
        </Spin>
      </Card>
    );
  }
}

TriggerException.propTypes = {
  isloading: PropTypes.bool,
  dispatch: PropTypes.func.isRequired,
};

TriggerException.defaultProps = {
  isloading: false,
};
