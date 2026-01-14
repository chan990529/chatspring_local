// --- src/Pages/HomePage.js ---
import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
    return (
            <div className="home-page">
                <h2>치맨과 함께</h2>
                <p></p>

                {/* 주곳(Dashboard)으로 이동 */}
                <Link to="/dashboard" className="dashboard-link">
                    주곳으로 이동
                </Link>

                {/* 스캘핑 연구소로 이동 */}
                <Link
                    to="/Scalping" className="dashboard-link">
                    스캘핑 연구소로 이동
                </Link>
            </div>
    );
};

export default HomePage;
