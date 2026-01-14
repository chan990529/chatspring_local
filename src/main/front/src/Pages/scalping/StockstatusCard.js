import React from 'react';
import { Card, CardContent, Typography, useMediaQuery } from '@mui/material';

const StockstatusCard = ({ stockName, captureCount, winCount, loseCount, winRate, resistPrice }) => {
    // const isPC = useMediaQuery('(min-width: 1024px)'); // 1024px 이상을 PC로 간주
    //
    // if (!isPC) return null; // PC가 아닐 경우 렌더링하지 않음

    return (
        <Card sx={{ marginBottom: 2, padding: 2, boxShadow: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>종목명: {stockName}</Typography>
                <Typography>포착횟수: {captureCount}</Typography>
                <Typography>승리횟수: {winCount}</Typography>
                <Typography>패배횟수: {loseCount}</Typography>
                <Typography>승률: {winRate}%</Typography>
                <Typography>저항값: {resistPrice}</Typography>
            </CardContent>
        </Card>
    );
};

export default StockstatusCard;
