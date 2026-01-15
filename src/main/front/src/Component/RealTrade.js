import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const RealTrade = () => {
    const [realTrades, setRealTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [selectedStockName, setSelectedStockName] = useState('');
    // 현재 로그인한 유저의 닉네임 저장용 state
    const [currentUserNickname, setCurrentUserNickname] = useState('');
    // 상세보기 모달 관련 state
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState(null);

    // 로그인 상태 확인
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // 쿠키 방식 사용: localStorage에서 토큰을 읽지 않음
                const response = await axios.get(`${config.API_BASE_URL}/api/user/me`, {
                    withCredentials: true // 쿠키 자동 전송
                });
                
                setIsLoggedIn(response.data.auth === true);
                
                // 닉네임 저장
                if (response.data.auth) {
                    setCurrentUserNickname(response.data.nickname);
                } else {
                    setIsLoggedIn(false);
                    setCurrentUserNickname('');
                }
            } catch (err) {
                setIsLoggedIn(false);
                setCurrentUserNickname('');
            }
        };

        checkAuth();
    }, []);

    const fetchActiveRealTrades = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${config.API_BASE_URL}/api/jugot/realtrade/all`, {
                withCredentials: true
            });

            const trades = response.data || [];
            console.log('RealTrade 데이터:', trades);
            
            // 수익률 체크 및 자동 중단 처리 (5% 이상이면 자동 중단)
            for (const trade of trades) {
                if (trade.status === 'ACTIVE' && trade.buyPrice && trade.currentPrice && trade.buyPrice > 0) {
                    const profitRate = ((trade.currentPrice - trade.buyPrice) / trade.buyPrice) * 100;
                    
                    if (profitRate >= 5.0) {
                        console.log(`수익률이 5% 이상(${profitRate.toFixed(2)}%)이므로 자동 중단 처리: ${trade.stockName}`);
                        try {
                            // 쿠키 방식 사용: localStorage에서 토큰을 읽지 않음
                            await axios.put(
                                `${config.API_BASE_URL}/api/jugot/realtrade/${trade.id}/pause`,
                                {},
                                {
                                    withCredentials: true // 쿠키 자동 전송
                                }
                            );
                            console.log(`${trade.stockName} 자동 중단 완료`);
                        } catch (err) {
                            console.error(`${trade.stockName} 자동 중단 처리 중 오류:`, err);
                        }
                    }
                }
            }
            
            // 중단 처리 후 다시 데이터 가져오기
            const updatedResponse = await axios.get(`${config.API_BASE_URL}/api/jugot/realtrade/all`, {
                withCredentials: true
            });
            setRealTrades(updatedResponse.data || []);
            setError('');
        } catch (err) {
            console.error('실매매 목록 조회 오류:', err);
            setError('실매매 목록을 불러오는 중 오류가 발생했습니다.');
            setRealTrades([]);
        } finally {
            setLoading(false);
        }
    };

    // 업데이트 상태 확인
    useEffect(() => {
        const checkUpdateStatus = async () => {
            try {
                const response = await axios.get(`${config.API_BASE_URL}/api/jugot/update-status`, {
                    withCredentials: true
                });
                if (response.data) {
                    setIsUpdating(response.data.isUpdating || false);
                }
            } catch (error) {
                console.error('Error checking update status:', error);
            }
        };

        // 초기 확인
        checkUpdateStatus();

        // 5초마다 상태 확인
        const interval = setInterval(checkUpdateStatus, 5000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // 업데이트 중이면 데이터를 가져오지 않음
        if (isUpdating) {
            console.log('주가 업데이트 중이므로 데이터를 가져오지 않습니다.');
            return;
        }

        fetchActiveRealTrades();
    }, [isUpdating]);

    // 종목 클릭 핸들러 (참여/취소 토글 로직)
    const handleStockClick = async (tradeId, participants) => {
        if (!isLoggedIn) {
            alert('로그인이 필요합니다.');
            return;
        }

        // 현재 참여자 닉네임 목록 추출
        const memberNicknames = getParticipantNicknames(participants);
        
        // 이미 참여 중인지 확인
        const isJoined = memberNicknames.includes(currentUserNickname);
        
        // 참여 중이면 '나가기', 아니면 '참여하기' 로직 수행
        const endpoint = isJoined ? 'leave' : 'join';
        const actionName = isJoined ? '참여 취소' : '참여';
        const confirmMsg = isJoined 
            ? '정말 참여를 취소하시겠습니까?' 
            : '해당 종목 실매매에 참여하시겠습니까?';

        if (!window.confirm(confirmMsg)) {
            return;
        }

        try {
            // 쿠키 방식 사용: localStorage에서 토큰을 읽지 않음
            const response = await axios.put(
                `${config.API_BASE_URL}/api/jugot/realtrade/${tradeId}/${endpoint}`,
                {},
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true // 쿠키 자동 전송
                }
            );

            if (response.data.success) {
                alert(response.data.message || `${actionName} 되었습니다.`);
                // 목록 새로고침
                await fetchActiveRealTrades();
            } else {
                alert(response.data.error || `${actionName} 중 오류가 발생했습니다.`);
            }
        } catch (err) {
            console.error(`${actionName} 오류:`, err);
            const errorMessage = err.response?.data?.error || `${actionName} 중 오류가 발생했습니다.`;
            alert(errorMessage);
        }
    };

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

    // 경과일 계산 함수 (시작일로부터 오늘까지)
    const calculateDaysElapsed = (startDateStr) => {
        if (!startDateStr) return null;
        try {
            const startDate = new Date(startDateStr);
            const today = new Date();
            
            // 시간을 00:00:00으로 설정하여 날짜만 비교
            startDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            
            // 밀리초 차이를 일 단위로 변환
            const diffTime = today.getTime() - startDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            return diffDays;
        } catch (error) {
            return null;
        }
    };

    // 경과일 포맷팅 함수
    const formatDaysElapsed = (days) => {
        if (days === null || days === undefined) {
            return '-';
        }
        return `${days}일`;
    };

    // 수익률 계산 함수
    const calculateProfitRate = (currentPrice, basePrice) => {
        if (!currentPrice || !basePrice || basePrice === 0) {
            return null;
        }
        return ((currentPrice - basePrice) / basePrice) * 100;
    };

    // 수익률 포맷팅 함수
    const formatProfitRate = (profitRate) => {
        if (profitRate === null || profitRate === undefined || isNaN(profitRate)) {
            return '';
        }
        const sign = profitRate >= 0 ? '+' : '';
        return `${sign}${profitRate.toFixed(2)}%`;
    };

    // 평단가와 수익률을 함께 표시하는 함수
    const formatAveragePriceWithProfit = (averagePrice, buyPrice, currentPrice) => {
        if (!averagePrice) {
            return '-';
        }
        
        const formattedPrice = `${formatNumber(averagePrice)}원`;
        
        // buyPrice와 averagePrice 대비 수익률 계산
        let profitRates = [];
        
        // 매수가 대비 수익률
        if (buyPrice && currentPrice) {
            const buyProfitRate = calculateProfitRate(currentPrice, buyPrice);
            if (buyProfitRate !== null && !isNaN(buyProfitRate)) {
                profitRates.push({
                    label: '매수가',
                    rate: buyProfitRate,
                    formatted: formatProfitRate(buyProfitRate)
                });
            }
        }
        
        // 평단가 대비 수익률
        if (currentPrice && averagePrice) {
            const avgProfitRate = calculateProfitRate(currentPrice, averagePrice);
            if (avgProfitRate !== null && !isNaN(avgProfitRate)) {
                profitRates.push({
                    label: '평단가',
                    rate: avgProfitRate,
                    formatted: formatProfitRate(avgProfitRate)
                });
            }
        }
        
        if (profitRates.length === 0) {
            return formattedPrice;
        }
        
        return (
            <span>
                {formattedPrice}
                {' '}
                {profitRates.map((pr, index) => (
                    <span key={index} style={{
                        color: pr.rate >= 0 ? '#ff6b6b' : '#4ecdc4',
                        marginLeft: index > 0 ? '8px' : '0',
                        fontWeight: 'bold'
                    }}>
                        ({pr.formatted})
                    </span>
                ))}
            </span>
        );
    };

    // participants 배열에서 닉네임 리스트 추출
    const getParticipantNicknames = (participants) => {
        if (!participants || !Array.isArray(participants)) {
            return [];
        }
        return participants.map(p => p.nickname).filter(nickname => nickname && nickname.trim() !== '');
    };

    // 모달 열기 함수
    const handleViewMembers = (e, participants, stockName) => {
        e.stopPropagation(); // 행 클릭 이벤트 방지
        const memberNicknames = getParticipantNicknames(participants);
        setSelectedMembers(memberNicknames);
        setSelectedStockName(stockName);
        setModalOpen(true);
    };

    // 모달 닫기 함수
    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedMembers([]);
        setSelectedStockName('');
    };

    // 상세보기 모달 열기 함수
    const handleViewDetails = (e, trade) => {
        e.stopPropagation(); // 행 클릭 이벤트 방지
        setSelectedTrade(trade);
        setDetailModalOpen(true);
    };

    // 상세보기 모달 닫기 함수
    const handleCloseDetailModal = () => {
        setDetailModalOpen(false);
        setSelectedTrade(null);
    };

    if (loading) {
        return (
            <Box sx={{ px: 2, py: 3 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                    실매매
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <CircularProgress size={20} />
                    <Typography>로딩 중...</Typography>
                </Stack>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ px: 2, py: 3 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                    실매매
                </Typography>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ px: 2, py: 3 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                실매매
            </Typography>
            {isUpdating && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    주가 업데이트 중입니다. 잠시만 기다려주세요...
                </Alert>
            )}
            <Typography color="text.secondary" sx={{ mb: 2 }}>
                진행 중인 실매매 현황을 확인할 수 있습니다.
                {isLoggedIn && (
                    <Box component="span" sx={{ display: 'block', mt: 1, color: 'success.main' }}>
                        종목을 클릭하여 참여하거나 취소할 수 있습니다.
                    </Box>
                )}
            </Typography>

            {realTrades.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography color="text.secondary">진행 중인 실매매가 없습니다.</Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>종목명</TableCell>
                                <TableCell>종목코드</TableCell>
                                <TableCell>평단가</TableCell>
                                <TableCell>시작일</TableCell>
                                <TableCell>경과일</TableCell>
                                <TableCell>매수 횟수</TableCell>
                                <TableCell>참여자</TableCell>
                                <TableCell>상태</TableCell>
                                <TableCell>상세보기</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {realTrades.map((trade) => {
                                const participantNicknames = getParticipantNicknames(trade.participants);
                                const isUserParticipating = participantNicknames.includes(currentUserNickname);

                                return (
                                    <TableRow
                                        key={trade.id}
                                        hover
                                        onClick={() => handleStockClick(trade.id, trade.participants)}
                                        sx={{
                                            cursor: isLoggedIn ? 'pointer' : 'default',
                                            bgcolor: isUserParticipating ? 'rgba(76, 175, 80, 0.12)' : undefined
                                        }}
                                    >
                                        <TableCell>{trade.stockName || '-'}</TableCell>
                                        <TableCell>{trade.stockCode || '-'}</TableCell>
                                        <TableCell>{formatAveragePriceWithProfit(trade.averagePrice, trade.buyPrice, trade.currentPrice)}</TableCell>
                                        <TableCell>{formatDate(trade.startDate)}</TableCell>
                                        <TableCell>{formatDaysElapsed(calculateDaysElapsed(trade.startDate))}</TableCell>
                                        <TableCell>{trade.currentBuyCount || 0}</TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            {participantNicknames.length > 0 ? (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="success"
                                                    onClick={(e) => handleViewMembers(e, trade.participants, trade.stockName)}
                                                >
                                                    보기 ({participantNicknames.length}명)
                                                </Button>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={trade.status === 'ACTIVE' ? '진행중' : trade.status === 'PAUSED' ? '중단' : trade.status === 'COMPLETED' ? '완료' : trade.status}
                                                color={trade.status === 'ACTIVE' ? 'success' : trade.status === 'PAUSED' ? 'warning' : 'default'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={(e) => handleViewDetails(e, trade)}
                                            >
                                                상세보기
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ pr: 5 }}>
                    {selectedStockName} 참여자 목록
                    <IconButton
                        onClick={handleCloseModal}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                        aria-label="닫기"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        총 {selectedMembers.length}명
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                        {selectedMembers.length > 0 ? (
                            selectedMembers.map((member, index) => (
                                <Chip
                                    key={index}
                                    label={`${index + 1}. ${member}`}
                                    variant="outlined"
                                    color="success"
                                />
                            ))
                        ) : (
                            <Typography color="text.secondary">참여자가 없습니다.</Typography>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal}>닫기</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={detailModalOpen} onClose={handleCloseDetailModal} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ pr: 5 }}>
                    {selectedTrade?.stockName} 상세 정보
                    <IconButton
                        onClick={handleCloseDetailModal}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                        aria-label="닫기"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedTrade && (
                        <Stack spacing={2}>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                    종목명
                                </Typography>
                                <Typography sx={{ fontWeight: 700 }}>
                                    {selectedTrade.stockName || '-'}
                                </Typography>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                    시작 가격
                                </Typography>
                                <Typography sx={{ fontWeight: 700 }}>
                                    {selectedTrade.startPrice ? `${formatNumber(selectedTrade.startPrice)}원` : '-'}
                                </Typography>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                    시작 일자
                                </Typography>
                                <Typography sx={{ fontWeight: 700 }}>
                                    {formatDate(selectedTrade.startDate)}
                                </Typography>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                    매수 횟수
                                </Typography>
                                <Typography sx={{ fontWeight: 700 }}>
                                    {selectedTrade.currentBuyCount || 0}회
                                </Typography>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                    매수 금액 (평단가 × 매수횟수)
                                </Typography>
                                <Typography sx={{ fontWeight: 700 }}>
                                    {selectedTrade.averagePrice && selectedTrade.currentBuyCount
                                        ? `${formatNumber(selectedTrade.averagePrice * selectedTrade.currentBuyCount)}원`
                                        : '-'}
                                </Typography>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                    적립에 따른 평단가
                                </Typography>
                                <Typography sx={{ fontWeight: 700 }}>
                                    {selectedTrade.averagePrice ? `${formatNumber(selectedTrade.averagePrice)}원` : '-'}
                                </Typography>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                    수익률 상태
                                </Typography>
                                <Divider sx={{ my: 1 }} />
                                <Stack spacing={1}>
                                    {selectedTrade.startPrice && selectedTrade.currentPrice && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                시작 가격 대비
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    color: calculateProfitRate(selectedTrade.currentPrice, selectedTrade.startPrice) >= 0 ? '#ff6b6b' : '#4ecdc4',
                                                    fontWeight: 700
                                                }}
                                            >
                                                {formatProfitRate(calculateProfitRate(selectedTrade.currentPrice, selectedTrade.startPrice))}
                                            </Typography>
                                        </Box>
                                    )}
                                    {selectedTrade.averagePrice && selectedTrade.currentPrice && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                평단가 대비
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    color: calculateProfitRate(selectedTrade.currentPrice, selectedTrade.averagePrice) >= 0 ? '#ff6b6b' : '#4ecdc4',
                                                    fontWeight: 700
                                                }}
                                            >
                                                {formatProfitRate(calculateProfitRate(selectedTrade.currentPrice, selectedTrade.averagePrice))}
                                            </Typography>
                                        </Box>
                                    )}
                                    {(!selectedTrade.startPrice || !selectedTrade.currentPrice) &&
                                     (!selectedTrade.averagePrice || !selectedTrade.currentPrice) && (
                                        <Typography variant="body2" color="text.secondary">
                                            수익률 정보가 없습니다.
                                        </Typography>
                                    )}
                                </Stack>
                            </Paper>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDetailModal}>닫기</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RealTrade;
