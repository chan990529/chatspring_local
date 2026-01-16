// --- src/Pages/jugot/DashboardPage.js ---
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navigator from '../../Component/Navigator';
import JugotList from '../../Component/JugotList';
import Ranking from '../../Component/Ranking';
import RealTrade from '../../Component/RealTrade';
import PersonalTrade from '../../Component/PersonalTrade';
import AuthModal from '../../Component/AuthModal';
import UserInfoEdit from '../../Component/UserInfoEdit';
import RefreshableGrid from '../scalping/RefreshableGrid';
import axios from 'axios';
import config from '../../config';

import './jugot.css';

// 아이콘 컴포넌트 (깔끔한 디자인을 위해 추가)
const Icons = {
    Admin: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14a4 4 0 1 1 4-4 4 4 0 0 1-4 4z"></path>
        </svg>
    ),
    Lab: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 2v7.31"></path>
            <path d="M14 2v7.31"></path>
            <path d="M8.5 2h7"></path>
            <path d="M7 16h10"></path>
            <path d="M12 22v-6"></path>
            <path d="M19.48 22H4.52a2 2 0 0 1-1.92-2.5l2-9.68a2 2 0 0 1 1.96-1.59h10.88a2 2 0 0 1 1.96 1.59l2 9.68a2 2 0 0 1-1.92 2.5z"></path>
        </svg>
    ),
    User: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    ),
    Settings: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
    ),
    Logout: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
    ),
    Login: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
            <polyline points="10 17 15 12 10 7"></polyline>
            <line x1="15" y1="12" x2="3" y2="12"></line>
        </svg>
    )
};

const DashboardPage = () => {
    const [activeTab, setActiveTab] = useState('주곳리스트');
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isUserInfoEditOpen, setIsUserInfoEditOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
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
                    nickname: response.data.nickname,
                    requestedNickname: response.data.requestedNickname,
                    introductionLink: response.data.introductionLink
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
            nickname: data.nickname,
            requestedNickname: data.requestedNickname,
            introductionLink: data.introductionLink
        });
        setUserRole(data.role || 'USER');
    };

    const handleUserInfoUpdate = async () => {
        // 사용자 정보 업데이트 후 상태 갱신
        await checkAuth();
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
            
            // 4. 홈페이지로 이동 (jugot 앱의 홈)
            navigate('/');
        }
    };

    // 새로고침 함수: 캐시를 무효화하고 DB의 최신 데이터를 다시 가져옴
    const handleRefresh = () => {
        if (isRefreshing) {
            return; // 이미 새로고침 중이면 무시
        }

        try {
            setIsRefreshing(true);
            
            // 1. 캐시 무효화 (DB에서 최신 데이터를 다시 가져오도록 함)
            const CACHE_KEY = 'jugot_data_recent_6months';
            localStorage.removeItem(CACHE_KEY);
            
            // 2. refreshKey 증가하여 컴포넌트 강제 리렌더링
            setRefreshKey(prev => prev + 1);
            
        } catch (error) {
            console.error('데이터 새로고침 실패:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case '주곳리스트': return <JugotList key={`jugot-${refreshKey}`} />;
            case '등락랭킹':   return <Ranking key={`ranking-${refreshKey}`} />;
            case '실매매':     return <RealTrade key={`realtrade-${refreshKey}`} />;
            case '개인매매':   return <PersonalTrade key={`personal-${refreshKey}`} />;
            default:           return <JugotList key={`jugot-${refreshKey}`} />;
        }
    };

    return (
        <div>
            <div className="auth-header">
                <div className="header-actions-left">
                    {userRole === 'pingddak' && (
                        <Link to="/admin" className="glass-btn btn-danger">
                            <Icons.Admin />
                            <span>관리자</span>
                        </Link>
                    )}
                    {/* 원래 코드: <button onClick={() => navigate('/Scalping')} className="glass-btn btn-primary"> */}
                    <a href="https://scalping.kro.kr" target="_blank" rel="noopener noreferrer" className="glass-btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <Icons.Lab />
                        <span>연구소</span>
                    </a>
                </div>
                <div className="header-actions-right">
                    {isLoggedIn ? (
                        <>
                            <div className="user-profile-pill">
                                <span className="nickname-text">
                                    <Icons.User />
                                    {userInfo?.nickname || '사용자'}님
                                </span>
                                <div className="divider"></div>
                                <button
                                    onClick={() => setIsUserInfoEditOpen(true)}
                                    className="icon-only-btn"
                                    title="정보 수정"
                                >
                                    <Icons.Settings />
                                </button>
                            </div>
                            <button onClick={handleLogout} className="glass-btn btn-outline">
                                <Icons.Logout />
                                <span>로그아웃</span>
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setIsAuthModalOpen(true)} className="glass-btn btn-accent">
                            <Icons.Login />
                            <span>로그인</span>
                        </button>
                    )}
                </div>
            </div>
            <Navigator activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="content">{renderContent()}</main>
            <RefreshableGrid onRefresh={handleRefresh} />
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onLoginSuccess={handleLoginSuccess}
            />
            <UserInfoEdit
                isOpen={isUserInfoEditOpen}
                onClose={() => setIsUserInfoEditOpen(false)}
                userInfo={userInfo}
                onUpdate={handleUserInfoUpdate}
            />
        </div>
    );
};

export default DashboardPage;
