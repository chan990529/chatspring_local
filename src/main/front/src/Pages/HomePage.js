// --- src/Pages/HomePage.js ---
import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
    return (
            <div className="home-page">
                <h2>치맨과 함께</h2>
                <p></p>

                <div className="home-actions">
                    {/* 주곳(Dashboard)으로 이동 */}
                    <Link to="/dashboard" className="dashboard-link">
                        주곳으로 이동
                    </Link>

                    {/* 스캘핑 연구소로 이동 */}
                    {/* 원래 코드: <Link to="/Scalping" className="dashboard-link">스캘핑 연구소로 이동</Link> */}
                    <a href="https://scalping.kro.kr" className="dashboard-link" target="_blank" rel="noopener noreferrer">
                        스캘핑 연구소로 이동
                    </a>
                </div>
            </div>
    );
};

export default HomePage;
