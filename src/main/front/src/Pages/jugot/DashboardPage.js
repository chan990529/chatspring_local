// --- src/Pages/jugot/DashboardPage.js ---
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navigator from '../../Component/Navigator';
import JugotList from '../../Component/JugotList';
import Ranking from '../../Component/Ranking';
import RealTrade from '../../Component/RealTrade';
import PersonalTrade from '../../Component/PersonalTrade';
import AuthModal from '../../Component/AuthModal';
import axios from 'axios';
import config from '../../config';

import './jugot.css';

const DashboardPage = () => {
    const [activeTab, setActiveTab] = useState('주곳리스트');
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    const checkAuth = async () => {
        try {
            // 쿠키 방식 사용: localStorage에서 토큰을 읽지 않음
            // 백엔드에서 HttpOnly Cookie로 토큰을 관리하므로 withCredentials만 설정
            const response = await axios.get(`${config.API_BASE_URL}/api/user/me`, {
                withCredentials: true // 쿠키 자동 전송
            });
            
            if (response.data.auth) {
                setIsLoggedIn(true);
                setUserInfo({
                    username: response.data.username,
                    nickname: response.data.nickname
                });
                setUserRole(response.data.role);
                // localStorage에 role 저장하지 않음 (보안 강화)
            } else {
                setIsLoggedIn(false);
                setUserInfo(null);
                setUserRole(null);
            }
        } catch (error) {
            setIsLoggedIn(false);
            setUserInfo(null);
            setUserRole(null);
        }
    };

    // 컴포넌트 마운트 시 인증 확인
    useEffect(() => {
        checkAuth();
    }, []);

    // 페이지 포커스 시 인증 상태 재확인 (다른 페이지에서 돌아올 때)
    useEffect(() => {
        const handleFocus = () => {
            checkAuth();
        };

        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    // 라우트 변경 시 인증 상태 재확인
    useEffect(() => {
        checkAuth();
    }, [location.pathname]);

    const handleLoginSuccess = (data) => {
        setIsLoggedIn(true);
        setUserInfo({
            username: data.username,
            nickname: data.nickname
        });
        setUserRole(data.role || 'USER');
    };

    const handleLogout = async () => {
        try {
            // 1. 서버에 로그아웃 요청 (쿠키 삭제를 위해 필수)
            await axios.post(`${config.API_BASE_URL}/api/logout`, {}, { withCredentials: true });
        } catch (error) {
            console.error("Logout request failed", error);
        } finally {
            // 2. 클라이언트 측 정리 (localStorage 및 상태 초기화)
            localStorage.removeItem('authToken');
            localStorage.removeItem('authTokenExpiry');
            localStorage.removeItem('authVersion');
            
            // 3. 로컬 상태 초기화
            setIsLoggedIn(false);
            setUserInfo(null);
            setUserRole(null);
            
            // 4. 로그인 페이지로 이동
            navigate('/login');
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case '주곳리스트': return <JugotList />;
            case '등락랭킹':   return <Ranking />;
            case '실매매':     return <RealTrade />;
            case '개인매매':   return <PersonalTrade />;
            default:           return <JugotList />;
        }
    };

    return (
        <div>
            <div className="auth-header">
                <div className="auth-header-content">
                    {isLoggedIn ? (
                        <div className="user-info">
                            {userRole === 'pingddak' && (
                                <Link 
                                    to="/admin" 
                                    className="admin-link-btn"
                                    style={{
                                        marginRight: '10px',
                                        padding: '8px 16px',
                                        backgroundColor: '#ff6b6b',
                                        color: 'white',
                                        textDecoration: 'none',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    관리자 페이지로
                                </Link>
                            )}
                            <span className="user-nickname">{userInfo?.nickname || '사용자'}님</span>
                            <button onClick={handleLogout} className="logout-btn">로그아웃</button>
                        </div>
                    ) : (
                        <button onClick={() => setIsAuthModalOpen(true)} className="login-btn">
                            로그인 / 회원가입
                        </button>
                    )}
                </div>
            </div>
            <Navigator activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="content">{renderContent()}</main>
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onLoginSuccess={handleLoginSuccess}
            />
        </div>
    );
};

export default DashboardPage;
