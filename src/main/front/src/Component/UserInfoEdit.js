import React, { useState, useEffect } from 'react';
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

const UserInfoEdit = ({ isOpen, onClose, userInfo, onUpdate }) => {
    const [activeTab, setActiveTab] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [validationErrors, setValidationErrors] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    // 탭 1: 기본 정보 상태
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [introductionLink, setIntroductionLink] = useState('');

    // 탭 2: 닉네임 변경 상태
    const [requestedNickname, setRequestedNickname] = useState('');
    const [requesting, setRequesting] = useState(false);

    useEffect(() => {
        if (isOpen && userInfo) {
            setIntroductionLink(userInfo.introductionLink || '');
            setRequestedNickname(userInfo.requestedNickname || '');
            // 폼 초기화
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError('');
            setSuccess('');
            setValidationErrors({ newPassword: '', confirmPassword: '' });
        }
    }, [isOpen, userInfo]);

    // 비밀번호 검증 함수
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

    // 비밀번호 변경 처리
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('모든 필드를 입력해주세요.');
            setLoading(false);
            return;
        }

        // 비밀번호 검증
        const passwordError = validatePassword(newPassword);
        const passwordConfirmError = validatePasswordConfirm(newPassword, confirmPassword);

        setValidationErrors({
            newPassword: passwordError,
            confirmPassword: passwordConfirmError
        });

        if (passwordError || passwordConfirmError) {
            setLoading(false);
            return;
        }

        try {
            const response = await axios.put(
                `${config.API_BASE_URL}/api/user/me/password`,
                {
                    currentPassword,
                    newPassword
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                setSuccess('비밀번호가 성공적으로 변경되었습니다.');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setValidationErrors({ newPassword: '', confirmPassword: '' });
                setTimeout(() => {
                    setSuccess('');
                }, 3000);
            }
        } catch (err) {
            setError(err.response?.data?.error || '비밀번호 변경 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 자기소개 링크 업데이트
    const handleIntroductionLinkUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await axios.put(
                `${config.API_BASE_URL}/api/user/me/introduction-link`,
                {
                    introductionLink: introductionLink || ''
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                setSuccess('자기소개 링크가 업데이트되었습니다.');
                if (onUpdate) {
                    onUpdate();
                }
                setTimeout(() => {
                    setSuccess('');
                }, 3000);
            }
        } catch (err) {
            setError(err.response?.data?.error || '자기소개 링크 업데이트 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 닉네임 변경 신청
    const handleNicknameRequest = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setRequesting(true);

        if (!requestedNickname || requestedNickname.trim() === '') {
            setError('변경할 닉네임을 입력해주세요.');
            setRequesting(false);
            return;
        }

        try {
            const response = await axios.post(
                `${config.API_BASE_URL}/api/user/me/nickname-request`,
                {
                    requestedNickname: requestedNickname.trim()
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                setSuccess('닉네임 변경 요청이 접수되었습니다. 관리자 승인을 기다려주세요.');
                if (onUpdate) {
                    onUpdate();
                }
                setTimeout(() => {
                    setSuccess('');
                }, 3000);
            }
        } catch (err) {
            setError(err.response?.data?.error || '닉네임 변경 요청 중 오류가 발생했습니다.');
        } finally {
            setRequesting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>정보 수정</DialogTitle>
            <DialogContent>
                <Tabs
                    value={activeTab}
                    onChange={(event, value) => setActiveTab(value)}
                    sx={{ mb: 2 }}
                >
                    <Tab value={1} label="기본 정보" />
                    <Tab value={2} label="닉네임 변경" />
                </Tabs>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                {activeTab === 1 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box component="form" onSubmit={handlePasswordChange} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="h6">비밀번호 변경</Typography>
                            <TextField
                                label="현재 비밀번호"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="현재 비밀번호를 입력하세요"
                            />
                            <TextField
                                label="새 비밀번호"
                                type="password"
                                value={newPassword}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setNewPassword(value);
                                    const passwordError = validatePassword(value);
                                    setValidationErrors(prev => ({
                                        ...prev,
                                        newPassword: passwordError,
                                        confirmPassword: validatePasswordConfirm(value, confirmPassword)
                                    }));
                                }}
                                placeholder="새 비밀번호를 입력하세요"
                                error={Boolean(validationErrors.newPassword)}
                                helperText={validationErrors.newPassword || '영문/숫자/특수문자(@$!%*#?&) 포함, 8~20자'}
                            />
                            <TextField
                                label="새 비밀번호 확인"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setConfirmPassword(value);
                                    setValidationErrors(prev => ({
                                        ...prev,
                                        confirmPassword: validatePasswordConfirm(newPassword, value)
                                    }));
                                }}
                                placeholder="새 비밀번호를 다시 입력하세요"
                                error={Boolean(validationErrors.confirmPassword)}
                                helperText={validationErrors.confirmPassword || ' '}
                            />
                            <Button type="submit" variant="contained" disabled={loading}>
                                {loading ? '처리 중...' : '비밀번호 변경'}
                            </Button>
                        </Box>

                        <Box component="form" onSubmit={handleIntroductionLinkUpdate} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="h6">자기소개 링크</Typography>
                            <TextField
                                label="노션 링크 (선택사항)"
                                type="url"
                                value={introductionLink}
                                onChange={(e) => setIntroductionLink(e.target.value)}
                                placeholder="https://..."
                            />
                            <Button type="submit" variant="outlined" disabled={loading}>
                                {loading ? '저장 중...' : '저장'}
                            </Button>
                        </Box>
                    </Box>
                )}

                {activeTab === 2 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="h6">닉네임 변경 신청</Typography>
                        {userInfo?.requestedNickname ? (
                            <Alert severity="info">
                                <Typography sx={{ fontWeight: 700 }}>승인 대기 중입니다</Typography>
                                <Typography>신청한 닉네임: {userInfo.requestedNickname}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    관리자 승인 후 변경됩니다.
                                </Typography>
                            </Alert>
                        ) : (
                            <>
                                <TextField
                                    label="현재 닉네임"
                                    value={userInfo?.nickname || ''}
                                    disabled
                                />
                                <Box component="form" onSubmit={handleNicknameRequest} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        label="변경할 닉네임"
                                        value={requestedNickname}
                                        onChange={(e) => setRequestedNickname(e.target.value)}
                                        placeholder="새 닉네임을 입력하세요"
                                    />
                                    <Button type="submit" variant="contained" disabled={requesting}>
                                        {requesting ? '요청 중...' : '변경 신청'}
                                    </Button>
                                </Box>
                            </>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose}>닫기</Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserInfoEdit;
