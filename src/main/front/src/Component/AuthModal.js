import React, { useState } from 'react';
import axios from 'axios';
import './AuthModal.css';
import config from '../config';

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        nickname: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                // 로그인: 쿠키 방식 사용 (백엔드에서 HttpOnly Cookie로 토큰 설정)
                const response = await axios.post(
                    `${config.API_BASE_URL}/api/user/login`,
                    {
                        username: formData.username,
                        password: formData.password
                    },
                    {
                        withCredentials: true // 쿠키 자동 전송
                    }
                );

                if (response.data.success) {
                    // localStorage에 토큰 저장하지 않음 (보안 강화)
                    // 토큰은 백엔드에서 HttpOnly Cookie로 설정됨
                    onLoginSuccess(response.data);
                    onClose();
                }
            } else {
                // 회원가입
                const response = await axios.post(
                    `${config.API_BASE_URL}/api/user/register`,
                    {
                        username: formData.username,
                        password: formData.password,
                        nickname: formData.nickname
                    }
                );

                if (response.data.success) {
                    alert('회원가입이 완료되었습니다. 로그인해주세요.');
                    setIsLogin(true);
                    setFormData({ username: '', password: '', nickname: '' });
                }
            }
        } catch (err) {
            const errorData = err.response?.data;
            const errorCode = errorData?.errorCode;
            const errorMessage = errorData?.error || '오류가 발생했습니다.';
            
            // 닉네임 중복인 경우 알림창 표시
            if (errorCode === 'NICKNAME_DUPLICATE') {
                alert('이미 존재하는 닉네임입니다. 다른 닉네임을 사용해주세요.');
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setFormData({ username: '', password: '', nickname: '' });
        setError('');
    };

    if (!isOpen) return null;

    return (
        <div className="auth-modal-overlay" onClick={onClose}>
            <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="auth-modal-close" onClick={onClose}>×</button>
                <h2>{isLogin ? '로그인' : '회원가입'}</h2>
                
                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="auth-form-group">
                            <label>닉네임</label>
                            <input
                                type="text"
                                name="nickname"
                                value={formData.nickname}
                                onChange={handleChange}
                                required
                                placeholder="닉네임을 입력하세요"
                            />
                        </div>
                    )}
                    <div className="auth-form-group">
                        <label>아이디</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            placeholder="아이디를 입력하세요"
                        />
                    </div>
                    <div className="auth-form-group">
                        <label>비밀번호</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="비밀번호를 입력하세요"
                        />
                    </div>
                    
                    {error && <div className="auth-error">{error}</div>}
                    
                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
                    </button>
                </form>

                <div className="auth-toggle">
                    {isLogin ? (
                        <>
                            계정이 없으신가요?{' '}
                            <button type="button" onClick={toggleMode} className="auth-toggle-btn">
                                회원가입
                            </button>
                        </>
                    ) : (
                        <>
                            이미 계정이 있으신가요?{' '}
                            <button type="button" onClick={toggleMode} className="auth-toggle-btn">
                                로그인
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;

