import React, { useState } from 'react';
import axios from 'axios';
import config from '../config';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Tab,
    Tabs,
    TextField,
    Typography
} from '@mui/material';

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

    const toggleMode = (mode) => {
        setIsLogin(mode);
        setFormData({ username: '', password: '', passwordConfirm: '', nickname: '' });
        setError('');
        setValidationErrors({ username: '', password: '', passwordConfirm: '', nickname: '' });
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                {isLogin ? '로그인' : '회원가입'}
            </DialogTitle>
            <DialogContent>
                <Tabs
                    value={isLogin ? 0 : 1}
                    onChange={(event, value) => toggleMode(value === 0)}
                    variant="fullWidth"
                    sx={{ mb: 2 }}
                >
                    <Tab label="로그인" />
                    <Tab label="회원가입" />
                </Tabs>

                <Box
                    id="auth-form"
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                    {!isLogin && (
                        <TextField
                            label="닉네임"
                            name="nickname"
                            value={formData.nickname}
                            onChange={handleChange}
                            required
                            placeholder="닉네임을 입력하세요"
                            error={Boolean(validationErrors.nickname)}
                            helperText={validationErrors.nickname || '한글/영문만 사용 가능, 최대 10자, 특수문자 불가'}
                        />
                    )}
                    <TextField
                        label="아이디"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        placeholder="아이디를 입력하세요"
                        error={!isLogin && Boolean(validationErrors.username)}
                        helperText={
                            !isLogin
                                ? (validationErrors.username || '영문 소문자/숫자만 사용 가능, 6~20자, 특수문자 불가')
                                : ''
                        }
                    />
                    <TextField
                        label="비밀번호"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="비밀번호를 입력하세요"
                        error={!isLogin && Boolean(validationErrors.password)}
                        helperText={
                            !isLogin
                                ? (validationErrors.password || '영문/숫자/특수문자(@$!%*#?&) 포함, 8~20자')
                                : ''
                        }
                    />
                    {!isLogin && (
                        <TextField
                            label="비밀번호 확인"
                            type="password"
                            name="passwordConfirm"
                            value={formData.passwordConfirm}
                            onChange={handleChange}
                            required
                            placeholder="비밀번호를 다시 입력하세요"
                            error={Boolean(validationErrors.passwordConfirm)}
                            helperText={validationErrors.passwordConfirm || ' '}
                        />
                    )}

                    {error && <Alert severity="error">{error}</Alert>}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose}>닫기</Button>
                <Button type="submit" form="auth-form" variant="contained" disabled={loading}>
                    {loading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
                </Button>
            </DialogActions>
            <Box sx={{ px: 3, pb: 3, textAlign: 'center' }}>
                {isLogin ? (
                    <Typography variant="body2" color="text.secondary">
                        계정이 없으신가요?{' '}
                        <Button size="small" onClick={() => toggleMode(false)}>
                            회원가입
                        </Button>
                    </Typography>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        이미 계정이 있으신가요?{' '}
                        <Button size="small" onClick={() => toggleMode(true)}>
                            로그인
                        </Button>
                    </Typography>
                )}
            </Box>
        </Dialog>
    );
};

export default AuthModal;

