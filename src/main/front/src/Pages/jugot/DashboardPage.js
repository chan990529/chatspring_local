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

    // 새로고침 함수: 주곳 데이터를 강제로 업데이트하고 캐시를 무효화
    const handleRefresh = async () => {
        if (isRefreshing) {
            return; // 이미 새로고침 중이면 무시
        }

        try {
            setIsRefreshing(true);
            
            // 1. 주곳 데이터 강제 업데이트 API 호출
            await axios.post(`${config.API_BASE_URL}/api/kiwoom/update-all`, {}, {
                withCredentials: true
            });
            
            // 2. 캐시 무효화
            const CACHE_KEY = 'jugot_data_recent_6months';
            localStorage.removeItem(CACHE_KEY);
            
            // 3. refreshKey 증가하여 컴포넌트 강제 리렌더링
            setRefreshKey(prev => prev + 1);
            
            // 4. 성공 메시지
            alert('데이터 업데이트가 시작되었습니다. 잠시 후 데이터가 갱신됩니다.');
            
        } catch (error) {
            console.error('데이터 새로고침 실패:', error);
            alert('데이터 새로고침 중 오류가 발생했습니다: ' + (error.response?.data?.message || error.message));
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
                <div className="auth-header-content">
                    {isLoggedIn ? (
                        <div className="user-info">
                            {userRole === 'pingddak' && (
                                <Link 
                                    to="/admin" 
                                    className="admin-link-btn"
                                >
                                    관리자 페이지로
                                </Link>
                            )}
                            <button 
                                onClick={() => setIsUserInfoEditOpen(true)} 
                                className="info-edit-btn"
                                title="정보 수정"
                            >
                                <span>⚙️</span>
                                <span>정보 수정</span>
                            </button>
                            <span className="user-nickname">{userInfo?.nickname || '사용자'}님</span>
                            <button onClick={() => navigate('/Scalping')} className="research-btn">
                                연구소로
                            </button>
                            <button onClick={handleLogout} className="logout-btn">로그아웃</button>
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <button onClick={() => setIsAuthModalOpen(true)} className="login-btn">
                                로그인 / 회원가입
                            </button>
                            <button onClick={() => navigate('/Scalping')} className="research-btn">
                                연구소로
                            </button>
                        </div>
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
