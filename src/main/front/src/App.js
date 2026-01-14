import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link, Outlet } from 'react-router-dom';
import axios from 'axios';
import config from './config';

// --- Providers ---
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// --- CSS ---
// [수정] 기본 App.css 대신, 우리가 만든 jugot.css를 import 합니다.
import './Pages/jugot/jugot.css';
// import './App.css'; // <- 이 라인은 삭제하거나 주석 처리합니다.

// --- App A (주곳매매) Pages ---
import HomePage from './Pages/HomePage';
import DashboardPage from './Pages/jugot/DashboardPage';
import AdminPage from './Component/admin';

// --- App B (스캘핑 연구소) Components ---
import ScalpingPage from './Pages/scalping/Scalping';
import StatisticsPage from './Pages/scalping/Statistics';
import TradeNotification from "./Pages/scalping/WebSocket";
import StatusPage from "./Pages/scalping/Status";
import ReviewPage from './Pages/scalping/Review';
import SimpleLogin from './Pages/scalping/SimpleLogin';
import TutorialPage from './Pages/scalping/Tutorial';
import Header from './Pages/scalping/Header';

// --- 1. QueryClient 인스턴스 (from App B) ---
const queryClient = new QueryClient();


// --- 2. ProtectedRoute (from App B) ---
// (수정 없이 그대로 사용)
function ProtectedRoute({ element }) {
    const [isAuth, setIsAuth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${config.API_BASE_URL}/api/check-auth`, { withCredentials: true })
            .then(response => {
                setIsAuth(true);
                setLoading(false);
            })
            .catch(error => {
                setIsAuth(false);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div>로딩 중...</div>;
    }

    if (!isAuth) {
        return <Navigate to="/login" replace />;
    }

    return element;
}

// --- 2-1. AdminProtectedRoute (관리자 권한 검증) ---
function AdminProtectedRoute({ element }) {
    const [isAuthorized, setIsAuthorized] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdminAccess = async () => {
            try {
                // 쿠키 방식 사용: localStorage에서 토큰을 읽지 않음
                const response = await axios.get(`${config.API_BASE_URL}/api/user/me`, {
                    withCredentials: true // 쿠키 자동 전송
                });

                if (response.data.auth && response.data.role === 'pingddak') {
                    setIsAuthorized(true);
                } else {
                    setIsAuthorized(false);
                }
            } catch (error) {
                setIsAuthorized(false);
            } finally {
                setLoading(false);
            }
        };

        checkAdminAccess();
    }, []);

    if (loading) {
        return <div>로딩 중...</div>;
    }

    if (!isAuthorized) {
        return <Navigate to="/" replace />;
    }

    return element;
}

// --- 3. App A (주곳매매)를 위한 별도 레이아웃 ---
const AppALayout = () => {
    return (
        // [수정] 여기에 jugot-scope 클래스를 추가합니다.
        // jugot.css의 모든 스타일은 이 클래스 내부에서만 활성화됩니다.
        <div className="jugot-scope">
            <div className="App"> {/* .jugot-scope .App 을 타겟팅 */}
                <header className="App-header">
                    <Link to="/" className="header-link">
                        <h1>나는치맨</h1>
                    </Link>
                </header>
                <Outlet />
            </div>
        </div>
    );
};

// --- 4. App B (스캘핑 연구소)를 위한 별도 레이아웃 ---
const Layout = () => {
    return (
        <div>
            <Header />
            <Outlet />
        </div>
    );
};


// --- 5. Main App Component (두 앱 통합) ---
function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <TradeNotification />

                <Routes>
                    {/* --- 공용 라우트 (Layout 없음) --- */}
                    <Route path="/login" element={<SimpleLogin />} />

                    {/* --- App A (주곳매매) 라우트 --- */}
                    {/* [수정] /dashboard 경로를 AppALayout 내부로 이동시킵니다. */}
                    <Route element={<AppALayout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/admin" element={<AdminProtectedRoute element={<AdminPage />} />} />
                    </Route>
                    {/* <Route path="/dashboard" element={<DashboardPage />} /> <- 여기서 이동 */}


                    {/* --- App B (스캘핑 연구소) 라우트 --- */}
                    {/* (수정 없음) App B는 Layout을 사용하며 jugot-scope의 영향을 받지 않습니다. */}
                    <Route element={<Layout />}>
                        <Route path="Scalping" element={<ProtectedRoute element={<ScalpingPage />} />} />
                        <Route path="Statistics" element={<ProtectedRoute element={<StatisticsPage />} />} />
                        <Route path="Status" element={<ProtectedRoute element={<StatusPage />} />} />
                        <Route path="Review" element={<ProtectedRoute element={<ReviewPage />} />} />
                        <Route path="Tutorial" element={<ProtectedRoute element={<TutorialPage />} />} />
                    </Route>
                </Routes>
            </Router>
        </QueryClientProvider>
    );
}

export default App;