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
import React, { useCallback, useState, useRef, useImperativeHandle } from "react";
import Captcha from "react-captcha-code";
import { randomNum, originalCharacter } from "../_utils/utils";

interface childProps {
    ChildGetCode: Function,
    onRef: any,
}

const LoginCode: React.FC<childProps> = (props) => {
    const { ChildGetCode } = props;
    const captchaRef = useRef<any>();
    const [code, setCode] = useState("");

    const handleClick = useCallback(() => {
        let str = "";
        for (let i = 0; i < 4; i++) {
            const temp =
                originalCharacter[randomNum(0, originalCharacter.length - 1)];
            str = `${str}${temp}`;
        }
        setCode(str);
        ChildGetCode(str);
    }, []);

    useImperativeHandle(props.onRef, () => {
        return {
            handleChange: handleClick,
        };
    });

    return (
        <span style={{ cursor: 'pointer' }}>
            <Captcha onClick={handleClick} code={code} />
        </span>
    );
}

export default LoginCode;
