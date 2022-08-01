import React, { useCallback, useState, useRef, useLayoutEffect } from "react";
import Captcha from "react-captcha-code";

interface childProps {
    ChildGetCode: Function,
}

const LoginCode: React.FC<childProps> = (props) => {
    const { ChildGetCode } = props;
    const captchaRef = useRef<any>();
    const [captcha, setCaptcha] = useState("");
    const handleChange = useCallback((code) => {
        setCaptcha(code);
        ChildGetCode(code)
    }, []);

    return (
        <span style={{ cursor: 'pointer' }}>
            <Captcha onChange={handleChange} ref={captchaRef} />
        </span>
    );
}

export default LoginCode;
