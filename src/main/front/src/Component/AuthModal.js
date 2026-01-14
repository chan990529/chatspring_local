import React, { useState } from 'react';
import axios from 'axios';
import './AuthModal.css';
import config from '../config';

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        passwordConfirm: '',
        nickname: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({
        username: '',
        password: '',
        passwordConfirm: '',
        nickname: ''
    });

    // 검증 함수들
    const validateUsername = (username) => {
        if (!username) return '';
        const pattern = /^[a-z0-9]{6,20}$/;
        if (!pattern.test(username)) {
            return '아이디는 영문 소문자와 숫자만 사용 가능하며, 6~20자여야 합니다.';
        }
        return '';
    };

    const validateNickname = (nickname) => {
        if (!nickname) return '';
        const pattern = /^[가-힣a-zA-Z]{1,10}$/;
        if (!pattern.test(nickname)) {
            return '닉네임은 한글과 영문만 사용 가능하며, 최대 10자까지 입력 가능합니다.';
        }
        return '';
    };

    const validatePassword = (password) => {
        if (!password) return '';
        const pattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,20}$/;
        if (!pattern.test(password)) {
            return '비밀번호는 영문, 숫자, 특수문자(@$!%*#?&)를 포함하여 8~20자여야 합니다.';
        }
        return '';
    };

    const validatePasswordConfirm = (password, passwordConfirm) => {
        if (!passwordConfirm) return '';
        if (password !== passwordConfirm) {
            return '비밀번호가 일치하지 않습니다.';
        }
        return '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        setError('');

        // 실시간 검증
        let validationError = '';
        if (name === 'username') {
            validationError = validateUsername(value);
        } else if (name === 'nickname') {
            validationError = validateNickname(value);
        } else if (name === 'password') {
            validationError = validatePassword(value);
            // 비밀번호가 변경되면 비밀번호 확인도 다시 검증
            setValidationErrors(prev => ({
                ...prev,
                password: validationError,
                passwordConfirm: validatePasswordConfirm(value, formData.passwordConfirm)
            }));
            return;
        } else if (name === 'passwordConfirm') {
            validationError = validatePasswordConfirm(formData.password, value);
        }

        setValidationErrors(prev => ({
            ...prev,
            [name]: validationError
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // 회원가입 시 검증
        if (!isLogin) {
            const usernameError = validateUsername(formData.username);
            const nicknameError = validateNickname(formData.nickname);
            const passwordError = validatePassword(formData.password);
            const passwordConfirmError = validatePasswordConfirm(formData.password, formData.passwordConfirm);

            setValidationErrors({
                username: usernameError,
                nickname: nicknameError,
                password: passwordError,
                passwordConfirm: passwordConfirmError
            });

            if (usernameError || nicknameError || passwordError || passwordConfirmError) {
                return;
            }
        }

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
                    setFormData({ username: '', password: '', passwordConfirm: '', nickname: '' });
                    setValidationErrors({ username: '', password: '', passwordConfirm: '', nickname: '' });
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
        setFormData({ username: '', password: '', passwordConfirm: '', nickname: '' });
        setError('');
        setValidationErrors({ username: '', password: '', passwordConfirm: '', nickname: '' });
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
                            <div className="auth-form-hint">한글/영문만 사용 가능, 최대 10자, 특수문자 불가</div>
                            {validationErrors.nickname && (
                                <div className="auth-validation-error">{validationErrors.nickname}</div>
                            )}
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
                        {!isLogin && (
                            <>
                                <div className="auth-form-hint">영문 소문자/숫자만 사용 가능, 6~20자, 특수문자 불가</div>
                                {validationErrors.username && (
                                    <div className="auth-validation-error">{validationErrors.username}</div>
                                )}
                            </>
                        )}
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
                        {!isLogin && (
                            <>
                                <div className="auth-form-hint">영문/숫자/특수문자(@$!%*#?&) 포함, 8~20자</div>
                                {validationErrors.password && (
                                    <div className="auth-validation-error">{validationErrors.password}</div>
                                )}
                            </>
                        )}
                    </div>
                    {!isLogin && (
                        <div className="auth-form-group">
                            <label>비밀번호 확인</label>
                            <input
                                type="password"
                                name="passwordConfirm"
                                value={formData.passwordConfirm}
                                onChange={handleChange}
                                required
                                placeholder="비밀번호를 다시 입력하세요"
                            />
                            {validationErrors.passwordConfirm && (
                                <div className="auth-validation-error">{validationErrors.passwordConfirm}</div>
                            )}
                        </div>
                    )}
                    
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

