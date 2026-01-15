import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config';
import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    Divider,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';

const PersonalTrade = () => {
    const [participants, setParticipants] = useState([]);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [trades, setTrades] = useState([]);
    const [loadingParticipants, setLoadingParticipants] = useState(true);
    const [loadingTrades, setLoadingTrades] = useState(false);
    const [error, setError] = useState('');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // 참여자 목록 조회
    const fetchParticipants = async () => {
        try {
            setLoadingParticipants(true);
            const response = await axios.get(`${config.API_BASE_URL}/api/jugot/realtrade/participants`, {
                withCredentials: true
            });

            setParticipants(response.data || []);
            setError('');
        } catch (err) {
            console.error('참여자 목록 조회 오류:', err);
            setError('참여자 목록을 불러오는 중 오류가 발생했습니다.');
            setParticipants([]);
        } finally {
            setLoadingParticipants(false);
        }
    };

    // 특정 참여자의 실매매 목록 조회 (ACTIVE + COMPLETED)
    const fetchTradesByParticipant = async (participantName) => {
        if (!participantName) {
            setTrades([]);
            return;
        }

        try {
            setLoadingTrades(true);
            // URL 인코딩 처리
            const encodedName = encodeURIComponent(participantName);
            const response = await axios.get(
                `${config.API_BASE_URL}/api/jugot/realtrade/participants/${encodedName}/all`,
                {
                    withCredentials: true
                }
            );

            // 응답 데이터를 정렬: ACTIVE 먼저, 그 다음 COMPLETED
            const sortedTrades = (response.data || []).sort((a, b) => {
                // ACTIVE가 COMPLETED보다 앞에 오도록
                if (a.status === 'ACTIVE' && b.status === 'COMPLETED') {
                    return -1;
                }
                if (a.status === 'COMPLETED' && b.status === 'ACTIVE') {
                    return 1;
                }
                // 같은 상태면 생성일 내림차순
                if (a.createdAt && b.createdAt) {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                }
                return 0;
            });

            setTrades(sortedTrades);
            setError('');
        } catch (err) {
            console.error('참여자 실매매 목록 조회 오류:', err);
            setError('실매매 목록을 불러오는 중 오류가 발생했습니다.');
            setTrades([]);
        } finally {
            setLoadingTrades(false);
        }
    };

    // 컴포넌트 마운트 시 참여자 목록 조회
    useEffect(() => {
        fetchParticipants();
    }, []);

    // 참여자 선택 시 실매매 목록 조회
    useEffect(() => {
        if (selectedParticipant) {
            fetchTradesByParticipant(selectedParticipant);
        } else {
            setTrades([]);
        }
    }, [selectedParticipant]);

    // 숫자 포맷팅 (천 단위 구분)
    const formatNumber = (num) => {
        if (!num) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // 날짜 포맷팅
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    };

    // 수익률 계산
    const calculateReturnRate = (trade) => {
        // COMPLETED 상태인 경우 finalReturnRate 사용
        if (trade.status === 'COMPLETED' && trade.finalReturnRate != null) {
            return trade.finalReturnRate;
        }
        
        // ACTIVE 상태인 경우 현재 수익률 계산: (현재가 - 평단가) / 평단가 * 100
        if (trade.status === 'ACTIVE' && trade.currentPrice != null && trade.averagePrice != null && trade.averagePrice > 0) {
            return ((trade.currentPrice - trade.averagePrice) / trade.averagePrice) * 100;
        }
        
        return null;
    };

    // 수익률 포맷팅
    const formatReturnRate = (rate) => {
        if (rate == null) return '-';
        const sign = rate >= 0 ? '+' : '';
        return `${sign}${rate.toFixed(2)}%`;
    };

    // 종합수익률 계산 (가중평균)
    const calculateTotalReturnRate = () => {
        if (trades.length === 0) return null;
        
        let totalInvested = 0;
        let totalReturn = 0;
        
        trades.forEach(trade => {
            const investPer = trade.investPer || 0;
            const returnRate = calculateReturnRate(trade);
            
            if (returnRate != null && investPer > 0) {
                totalInvested += investPer;
                totalReturn += investPer * returnRate;
            }
        });
        
        if (totalInvested === 0) return null;
        return totalReturn / totalInvested;
    };

    // 참여자 클릭 핸들러
    const handleParticipantClick = (participantName) => {
        setSelectedParticipant(participantName === selectedParticipant ? null : participantName);
    };

    if (loadingParticipants) {
        return (
            <Box sx={{ px: 2, py: 3 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                    Personal Trade
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <CircularProgress size={20} />
                    <Typography>로딩 중...</Typography>
                </Stack>
            </Box>
        );
    }

    if (error && participants.length === 0) {
        return (
            <Box sx={{ px: 2, py: 3 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                    Personal Trade
                </Typography>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ px: 2, py: 3 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
                참여자를 선택하면 해당 참여자가 참여 중인 실매매 현황을 확인할 수 있습니다.
            </Typography>

            <Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
                <Paper variant="outlined" sx={{ flex: isMobile ? 1 : '0 0 320px', p: 2, maxHeight: 600, overflowY: 'auto' }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        참여자 목록
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    {participants.length === 0 ? (
                        <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                            참여자가 없습니다.
                        </Typography>
                    ) : (
                        <List dense disablePadding>
                            {participants.map((participant, index) => (
                                <ListItemButton
                                    key={index}
                                    selected={selectedParticipant === participant.name}
                                    onClick={() => handleParticipantClick(participant.name)}
                                    sx={{ borderRadius: 1, mb: 0.5 }}
                                >
                                    <ListItemText
                                        primary={participant.name}
                                        secondary={
                                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                참여 {participant.totalCount}건
                                                {participant.activeCount > 0 && (
                                                    <Chip size="small" color="success" label={`진행중 ${participant.activeCount}건`} />
                                                )}
                                            </Box>
                                        }
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                    )}
                </Paper>

                <Paper variant="outlined" sx={{ flex: 1, p: 2 }}>
                    {!selectedParticipant ? (
                        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                            참여자를 선택하면 참여 중인 실매매가 표시됩니다.
                        </Box>
                    ) : loadingTrades ? (
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 6, justifyContent: 'center' }}>
                            <CircularProgress size={20} />
                            <Typography>로딩 중...</Typography>
                        </Stack>
                    ) : error ? (
                        <Alert severity="error">{error}</Alert>
                    ) : trades.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                            <Typography>
                                <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    {selectedParticipant}
                                </Box>
                                님이 참여 중인 실매매가 없습니다.
                            </Typography>
                        </Box>
                    ) : (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                {selectedParticipant}님의 실매매 현황
                            </Typography>
                            <Divider sx={{ mb: 1 }} />
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>종목명</TableCell>
                                            <TableCell>종목코드</TableCell>
                                            <TableCell>시작일</TableCell>
                                            <TableCell>수익률</TableCell>
                                            <TableCell>상태</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {trades.map((trade) => {
                                            const returnRate = calculateReturnRate(trade);
                                            const returnRateFormatted = formatReturnRate(returnRate);
                                            const returnRateColor = returnRate != null
                                                ? (returnRate >= 0 ? '#ff6b6b' : '#4ecdc4')
                                                : 'text.secondary';

                                            return (
                                                <TableRow key={trade.id} hover>
                                                    <TableCell>{trade.stockName || '-'}</TableCell>
                                                    <TableCell>{trade.stockCode || '-'}</TableCell>
                                                    <TableCell>{formatDate(trade.startDate)}</TableCell>
                                                    <TableCell sx={{ color: returnRateColor, fontWeight: 700 }}>
                                                        {returnRateFormatted}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            size="small"
                                                            label={trade.status === 'ACTIVE' ? '진행중' : trade.status === 'COMPLETED' ? '완료' : trade.status}
                                                            color={trade.status === 'ACTIVE' ? 'success' : 'default'}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {trades.length > 0 && (() => {
                                const totalReturnRate = calculateTotalReturnRate();
                                const totalReturnRateFormatted = formatReturnRate(totalReturnRate);
                                const totalReturnRateColor = totalReturnRate != null
                                    ? (totalReturnRate >= 0 ? '#ff6b6b' : '#4ecdc4')
                                    : 'text.secondary';

                                return (
                                    <Paper variant="outlined" sx={{ mt: 2, p: 2, display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography sx={{ fontWeight: 700 }}>종합수익률</Typography>
                                        <Typography sx={{ fontWeight: 700, color: totalReturnRateColor }}>
                                            {totalReturnRateFormatted}
                                        </Typography>
                                    </Paper>
                                );
                            })()}
                        </Box>
                    )}
                </Paper>
            </Stack>
        </Box>
    );
};

export default PersonalTrade;
