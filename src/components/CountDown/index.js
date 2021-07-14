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

import React, { Component } from 'react';

function fixedZero(val) {
  return val * 1 < 10 ? `0${val}` : val;
}

class CountDown extends Component {
  timer = 0;

  interval = 1000;

  constructor(props) {
    super(props);

    const { lastTime } = this.initTime(props);

    this.state = {
      lastTime,
    };
  }

  componentDidMount() {
    this.tick();
  }

  componentWillReceiveProps(nextProps) {
    const { target } = this.props;
    if (target !== nextProps.target) {
      clearTimeout(this.timer);
      const { lastTime } = this.initTime(nextProps);
      this.setState(
        {
          lastTime,
        },
        () => {
          this.tick();
        }
      );
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  initTime = props => {
    let lastTime = 0;
    let targetTime = 0;
    try {
      if (Object.prototype.toString.call(props.target) === '[object Date]') {
        targetTime = props.target.getTime();
      } else {
        targetTime = new Date(props.target).getTime();
      }
    } catch (e) {
      throw new Error('invalid target prop', e);
    }

    lastTime = targetTime - new Date().getTime();
    return {
      lastTime: lastTime < 0 ? 0 : lastTime,
    };
  };

  // defaultFormat = time => (
  //  <span>{moment(time).format('hh:mm:ss')}</span>
  // );
  defaultFormat = time => {
    const hours = 60 * 60 * 1000;
    const minutes = 60 * 1000;

    const h = Math.floor(time / hours);
    const m = Math.floor((time - h * hours) / minutes);
    const s = Math.floor((time - h * hours - m * minutes) / 1000);
    return (
      <span>
        {fixedZero(h)}
        :
        {fixedZero(m)}
        :
        {fixedZero(s)}
      </span>
    );
  };

  tick = () => {
    const { onEnd } = this.props;
    let { lastTime } = this.state;

    this.timer = setTimeout(() => {
      if (lastTime < this.interval) {
        clearTimeout(this.timer);
        this.setState(
          {
            lastTime: 0,
          },
          () => {
            if (onEnd) {
              onEnd();
            }
          }
        );
      } else {
        lastTime -= this.interval;
        this.setState(
          {
            lastTime,
          },
          () => {
            this.tick();
          }
        );
      }
    }, this.interval);
  };

  render() {
    const { format = this.defaultFormat, onEnd, ...rest } = this.props;
    const { lastTime } = this.state;
    const result = format(lastTime);

    return <span {...rest}>{result}</span>;
  }
}

export default CountDown;
