import React from 'react';

const Navigator = ({ activeTab, setActiveTab }) => {
    const tabs = ['주곳리스트', '등락랭킹', '실매매', '개인매매'];

    return (
        <nav className="navigator">
            {tabs.map(tab => (
                <button
                    key={tab}
                    className={activeTab === tab ? 'active' : ''}
                    onClick={() => setActiveTab(tab)}
                >
                    {tab}
                </button>
            ))}
        </nav>
    );
};

export default Navigator;