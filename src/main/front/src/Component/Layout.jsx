// src/components/Layout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Pages/scalping/Header'; // 상단 메뉴바 추가
import './Layout.css'; // 스타일 적용

function Layout() {
  return (
    <div className="layout-container">
      <div className="stock-section">
        <Header /> {/* 상단 메뉴바 */}
        <Outlet /> {/* 페이지 내용 (Home 또는 About) */}
      </div>
      {/*
      <div className="chat-section">

        <ChatComponent />

      </div>
      */}
    </div>
  );
}

export default Layout;
