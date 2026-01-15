import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';

const Navigator = ({ activeTab, setActiveTab }) => {
    const tabs = ['주곳리스트', '등락랭킹', '실매매', '개인매매'];

    const handleChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, bgcolor: 'background.paper' }}>
            <Tabs
                value={activeTab}
                onChange={handleChange}
                variant="scrollable"
                scrollButtons="auto"
                textColor="primary"
                indicatorColor="primary"
            >
                {tabs.map(tab => (
                    <Tab key={tab} label={tab} value={tab} />
                ))}
            </Tabs>
        </Box>
    );
};

export default Navigator;