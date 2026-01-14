import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Typography, Card,CardContent} from '@mui/material';

const ScriptStatus = () => {
    const [status, setStatus] = useState({
        status: 'Loading...',
        lastUpdateTime: 'N/A',
        details: 'N/A',
        error: null
    });



    useEffect(() => {
        const fetchStatus = () => {
            axios.get('/api/monitoring/status')
                .then((response) => {
                    setStatus(response.data);
                })
                .catch((error) => {
                    console.error('Failed to fetch script status:', error);
                    setStatus((prevStatus) => ({
                        ...prevStatus,
                        error: 'Failed to fetch status'
                    }));
                });
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 10000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Card sx={{ marginBottom: 2 }}>
            <CardContent>
                <Typography variant="h5">연구소 통신상태</Typography>
                <Typography><strong>상태:</strong> {status.status}</Typography>
                <Typography><strong>최종 업데이트:</strong> {status.lastUpdateTime}</Typography>
                <Typography><strong>내용:</strong> {status.details}</Typography>
                {status.error && (
                    <Typography color="error"><strong>Error:</strong> {status.error}</Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default ScriptStatus