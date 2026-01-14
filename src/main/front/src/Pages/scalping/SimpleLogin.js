// src/Pages/SimpleLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {Button} from "@mui/material";
import config from '../../config';

const SimpleLogin = () => {
    const [loginCode, setLoginCode] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const CURRENT_VERSION = 'fdh';

    const handleLogin = async () => {
        try {
            const response = await axios.post(`${config.API_BASE_URL}/api/login`, { code: loginCode }, { withCredentials: true });

            if (response.status === 200) {
                const token = response.data.token;

                // 마스터코드이면 영구적으로 저장
                if (loginCode === "IAMCHIMAN1357") {
                    localStorage.setItem('authToken', token);
                    localStorage.setItem('authTokenExpiry', 'permanent'); // 영구 보관 표시
                    localStorage.setItem('authVersion', CURRENT_VERSION);
                } else {
                    // 그 외에는 유효기간 20시간 설정
                    const expiryTime = Date.now() + 20 * 60 * 60 * 1000; // 20시간 후의 타임스탬프
                    localStorage.setItem('authToken', token);
                    localStorage.setItem('authVersion', CURRENT_VERSION);
                    localStorage.setItem('authTokenExpiry', expiryTime);
                }

                setMessage('로그인 성공!');
                // 튜토리얼 페이지 이동 여부 확인
                const hasVisitedTutorial = localStorage.getItem('hasVisitedTutorial');
                if (!hasVisitedTutorial) {
                    localStorage.setItem('hasVisitedTutorial', 'true');
                    navigate('/Tutorial'); // 튜토리얼 페이지로 이동
                } else {
                    navigate('/'); // 메인 페이지로 이동
                }
            } else {
                setMessage('누구냐...넌?');
            }
        } catch (error) {
            setMessage('누구냐...넌?');
        }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>!나는</h2>
            <input
                type="password"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                placeholder="암구호 입력"
            />
            <br />
            <Button onClick={handleLogin} style={{ marginTop: '20px' }} variant="contained">
                로그인
            </Button>
            <p>{message}</p>
        </div>
    );
};

export default SimpleLogin;
