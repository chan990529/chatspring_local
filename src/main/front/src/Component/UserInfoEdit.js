import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import './UserInfoEdit.css';

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
        <div className="user-info-edit-overlay" onClick={onClose}>
            <div className="user-info-edit-content" onClick={(e) => e.stopPropagation()}>
                <button className="user-info-edit-close" onClick={onClose}>×</button>
                
                <h2>정보 수정</h2>

                {/* 탭 메뉴 */}
                <div className="user-info-edit-tabs">
                    <button
                        className={activeTab === 1 ? 'active' : ''}
                        onClick={() => setActiveTab(1)}
                    >
                        기본 정보
                    </button>
                    <button
                        className={activeTab === 2 ? 'active' : ''}
                        onClick={() => setActiveTab(2)}
                    >
                        닉네임 변경
                    </button>
                </div>

                {/* 에러/성공 메시지 */}
                {error && <div className="user-info-edit-error">{error}</div>}
                {success && <div className="user-info-edit-success">{success}</div>}

                {/* 탭 1: 기본 정보 */}
                {activeTab === 1 && (
                    <div className="user-info-edit-tab-content">
                        <form onSubmit={handlePasswordChange}>
                            <h3>비밀번호 변경</h3>
                            <div className="user-info-edit-form-group">
                                <label>현재 비밀번호</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="현재 비밀번호를 입력하세요"
                                />
                            </div>
                            <div className="user-info-edit-form-group">
                                <label>새 비밀번호</label>
                                <input
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
                                />
                                <div className="user-info-edit-form-hint">영문/숫자/특수문자(@$!%*#?&) 포함, 8~20자</div>
                                {validationErrors.newPassword && (
                                    <div className="user-info-edit-validation-error">{validationErrors.newPassword}</div>
                                )}
                            </div>
                            <div className="user-info-edit-form-group">
                                <label>새 비밀번호 확인</label>
                                <input
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
                                />
                                {validationErrors.confirmPassword && (
                                    <div className="user-info-edit-validation-error">{validationErrors.confirmPassword}</div>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="user-info-edit-submit-btn"
                                disabled={loading}
                            >
                                {loading ? '처리 중...' : '비밀번호 변경'}
                            </button>
                        </form>

                        <form onSubmit={handleIntroductionLinkUpdate} style={{ marginTop: '30px' }}>
                            <h3>자기소개 링크</h3>
                            <div className="user-info-edit-form-group">
                                <label>노션 링크 (선택사항)</label>
                                <input
                                    type="url"
                                    value={introductionLink}
                                    onChange={(e) => setIntroductionLink(e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="user-info-edit-submit-btn"
                                disabled={loading}
                            >
                                {loading ? '저장 중...' : '저장'}
                            </button>
                        </form>
                    </div>
                )}

                {/* 탭 2: 닉네임 변경 */}
                {activeTab === 2 && (
                    <div className="user-info-edit-tab-content">
                        <h3>닉네임 변경 신청</h3>
                        
                        {userInfo?.requestedNickname ? (
                            <div className="user-info-edit-pending">
                                <p><strong>승인 대기 중입니다</strong></p>
                                <p>신청한 닉네임: <strong>{userInfo.requestedNickname}</strong></p>
                                <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                                    관리자 승인 후 변경됩니다.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="user-info-edit-form-group">
                                    <label>현재 닉네임</label>
                                    <input
                                        type="text"
                                        value={userInfo?.nickname || ''}
                                        disabled
                                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <form onSubmit={handleNicknameRequest}>
                                    <div className="user-info-edit-form-group">
                                        <label>변경할 닉네임</label>
                                        <input
                                            type="text"
                                            value={requestedNickname}
                                            onChange={(e) => setRequestedNickname(e.target.value)}
                                            placeholder="새 닉네임을 입력하세요"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="user-info-edit-submit-btn"
                                        disabled={requesting}
                                    >
                                        {requesting ? '요청 중...' : '변경 신청'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserInfoEdit;
