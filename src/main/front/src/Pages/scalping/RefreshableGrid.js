// RefreshableGrid.js
import React from 'react';
import { Fab } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

function RefreshableGrid({ onRefresh }) {

    return (
        <Fab
            color="secondary"
            onClick={onRefresh}  // 전달된 onRefresh 함수를 호출
            sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: 1000
            }}
        >
            <RefreshIcon />
        </Fab>
    );
}

export default RefreshableGrid;