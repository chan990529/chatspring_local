import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config';
import {
    Alert,
    Box,
    CircularProgress,
    Paper,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';

const Ranking = () => {
    const [topGainers, setTopGainers] = useState([]);
    const [topLosers, setTopLosers] = useState([]);
    const [realTradeTop15, setRealTradeTop15] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('gainers'); // 'gainers', 'losers', 또는 'realtrade'
    const [isUpdating, setIsUpdating] = useState(false);

    // JugotList와 동일한 캐시 키 사용 (최근 6개월)
    const CACHE_KEY = `jugot_data_recent_6months`;

    // 캐시에서 데이터를 가져오는 함수
    const getCachedData = () => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                const now = Date.now();
                const CACHE_DURATION = 30 * 60 * 1000; // 30분
                
                // 캐시가 30분 이내인지 확인
                if (now - timestamp < CACHE_DURATION) {
                    return data;
                } else {
                    // 만료된 캐시 삭제
                    localStorage.removeItem(CACHE_KEY);
                }
            }
        } catch (error) {
            console.error('Error reading cache:', error);
        }
        return null;
    };

    // 포착가 대비 현재가 상승률 계산
    const calculateChangeRate = (capturePrice, currentPrice) => {
        if (!capturePrice || !currentPrice || capturePrice === 0) {
            return 0;
        }
        return ((currentPrice - capturePrice) / capturePrice) * 100;
    };

    // 모든 주차 데이터에서 상승률/하락률 계산
    const calculateRankings = (allWeeksData) => {
        const allStocks = [];
        
        // 모든 주차의 데이터를 하나의 배열로 합치기
        Object.entries(allWeeksData).forEach(([weekKey, weekData]) => {
            if (Array.isArray(weekData)) {
                weekData.forEach(stock => {
                    if (stock.name && stock.capturePrice && stock.currentPrice) {
                        const changeRate = calculateChangeRate(stock.capturePrice, stock.currentPrice);
                        allStocks.push({
                            ...stock,
                            changeRate: changeRate,
                            weekKey: weekKey
                        });
                    }
                });
            }
        });

        // 상승률 기준으로 정렬 (양수만)
        const sortedByGain = [...allStocks]
            .filter(stock => stock.changeRate > 0)
            .sort((a, b) => b.changeRate - a.changeRate)
            .slice(0, 15);
        
        // 하락률 기준으로 정렬 (음수만, 가장 큰 음수값 순으로)
        const sortedByLoss = [...allStocks]
            .filter(stock => stock.changeRate < 0)
            .sort((a, b) => a.changeRate - b.changeRate) // 음수이므로 작은 값이 더 큰 하락률
            .slice(0, 15);

        return {
            topGainers: sortedByGain,
            topLosers: sortedByLoss
        };
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

    // 실매매 TOP15 데이터 가져오기
    const fetchRealTradeTop15 = async () => {
        try {
            const response = await axios.get(`${config.API_BASE_URL}/api/jugot/realtrade/all`, {
                withCredentials: true
            });

            const trades = response.data || [];
            
            // 진행중인 종목만 필터링하고 수익률 계산
            const activeTradesWithProfit = trades
                .filter(trade => trade.status === 'ACTIVE')
                .map(trade => {
                    // 평단가 또는 매수가를 기준으로 수익률 계산
                    const basePrice = trade.averagePrice || trade.buyPrice;
                    let profitRate = null;
                    
                    if (basePrice && trade.currentPrice && basePrice > 0) {
                        profitRate = ((trade.currentPrice - basePrice) / basePrice) * 100;
                    }
                    
                    return {
                        ...trade,
                        profitRate: profitRate,
                        basePrice: basePrice
                    };
                })
                .filter(trade => trade.profitRate !== null && !isNaN(trade.profitRate))
                .sort((a, b) => b.profitRate - a.profitRate) // 수익률 높은 순으로 정렬
                .slice(0, 15); // 상위 15개만
            
            setRealTradeTop15(activeTradesWithProfit);
        } catch (error) {
            console.error('Error loading real trade rankings:', error);
            setRealTradeTop15([]);
        }
    };

    useEffect(() => {
        const loadRankings = () => {
            try {
                setLoading(true);
                
                // 캐시된 데이터 가져오기
                const cachedData = getCachedData();
                
                if (cachedData && Object.keys(cachedData).length > 0) {
                    console.log('캐시된 데이터로 랭킹을 계산합니다.');
                    const rankings = calculateRankings(cachedData);
                    setTopGainers(rankings.topGainers);
                    setTopLosers(rankings.topLosers);
                } else {
                    console.log('캐시된 데이터가 없습니다. JugotList에서 먼저 데이터를 로드해주세요.');
                    setTopGainers([]);
                    setTopLosers([]);
                }
                
            } catch (error) {
                console.error('Error loading rankings:', error);
                setTopGainers([]);
                setTopLosers([]);
            } finally {
                setLoading(false);
            }
        };

        loadRankings();
        fetchRealTradeTop15();
        
        // 실매매 데이터는 주기적으로 갱신 (30초마다)
        const realTradeInterval = setInterval(fetchRealTradeTop15, 30000);
        
        return () => clearInterval(realTradeInterval);
    }, []);

    // 상승률 포맷팅 함수
    const formatChangeRate = (rate) => {
        const sign = rate >= 0 ? '+' : '';
        return `${sign}${rate.toFixed(2)}%`;
    };

    // 가격 포맷팅 함수 (천단위 콤마)
    const formatPrice = (price) => {
        return price ? price.toLocaleString() : 'N/A';
    };

    // 날짜 포맷팅 함수 (YYYY-MM-DD -> YYYY.MM.DD)
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        // LocalDate 형식 (YYYY-MM-DD)을 YYYY.MM.DD로 변환
        return dateString.replace(/-/g, '.');
    };

    // 랭킹 테이블 컴포넌트
    const RankingTable = ({ title, data, isGainers = true }) => (
        <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
                {title}
            </Typography>
            {data.length === 0 ? (
                <Typography color="text.secondary">데이터가 없습니다.</Typography>
            ) : (
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>순위</TableCell>
                                <TableCell>종목명</TableCell>
                                <TableCell align="right">포착가</TableCell>
                                <TableCell align="right">포착일</TableCell>
                                <TableCell align="right">현재가</TableCell>
                                <TableCell align="right">{isGainers ? '상승률' : '하락률'}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((stock, index) => (
                                <TableRow key={`${stock.name}-${stock.weekKey}-${index}`} hover>
                                    <TableCell>
                                        <Box
                                            component="span"
                                            sx={{
                                                px: 1,
                                                py: 0.25,
                                                borderRadius: 1,
                                                fontWeight: 700,
                                                bgcolor: isGainers ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                                                color: isGainers ? '#4caf50' : '#f44336'
                                            }}
                                        >
                                            {index + 1}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{stock.name}</TableCell>
                                    <TableCell align="right">{formatPrice(stock.capturePrice)}원</TableCell>
                                    <TableCell align="right">{formatDate(stock.captureDate)}</TableCell>
                                    <TableCell align="right">{formatPrice(stock.currentPrice)}원</TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{ color: stock.changeRate >= 0 ? '#ff6b6b' : '#4ecdc4', fontWeight: 700 }}
                                    >
                                        {formatChangeRate(stock.changeRate)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );

    // 실매매 TOP15 테이블 컴포넌트
    const RealTradeTable = ({ title, data }) => (
        <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
                {title}
            </Typography>
            {data.length === 0 ? (
                <Typography color="text.secondary">진행 중인 실매매가 없습니다.</Typography>
            ) : (
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>순위</TableCell>
                                <TableCell>종목명</TableCell>
                                <TableCell>종목코드</TableCell>
                                <TableCell align="right">평단가</TableCell>
                                <TableCell align="right">현재가</TableCell>
                                <TableCell align="right">수익률</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((trade, index) => (
                                <TableRow key={`${trade.id}-${index}`} hover>
                                    <TableCell>
                                        <Box
                                            component="span"
                                            sx={{
                                                px: 1,
                                                py: 0.25,
                                                borderRadius: 1,
                                                fontWeight: 700,
                                                bgcolor: 'rgba(76, 175, 80, 0.2)',
                                                color: '#4caf50'
                                            }}
                                        >
                                            {index + 1}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{trade.stockName || '-'}</TableCell>
                                    <TableCell>{trade.stockCode || '-'}</TableCell>
                                    <TableCell align="right">{formatPrice(trade.basePrice)}원</TableCell>
                                    <TableCell align="right">{formatPrice(trade.currentPrice)}원</TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{ color: trade.profitRate >= 0 ? '#ff6b6b' : '#4ecdc4', fontWeight: 700 }}
                                    >
                                        {formatChangeRate(trade.profitRate)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );

    if (loading) {
        return (
            <Box sx={{ px: 2, py: 3 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                    등락랭킹
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography>데이터를 불러오는 중...</Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ px: 2, py: 3 }}>
            {isUpdating && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    주가 업데이트 중입니다. 잠시만 기다려주세요...
                </Alert>
            )}

            <Tabs
                value={activeTab}
                onChange={(event, newValue) => setActiveTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2 }}
            >
                <Tab value="gainers" label="📈 상승률 TOP 15" />
                <Tab value="losers" label="📉 하락률 TOP 15" />
                <Tab value="realtrade" label="💰 실매매 TOP 15" />
            </Tabs>

            {activeTab === 'gainers' && (
                <RankingTable title="📈 상승률 TOP 15" data={topGainers} isGainers={true} />
            )}
            {activeTab === 'losers' && (
                <RankingTable title="📉 하락률 TOP 15" data={topLosers} isGainers={false} />
            )}
            {activeTab === 'realtrade' && (
                <RealTradeTable title="💰 실매매 TOP 15" data={realTradeTop15} />
            )}
        </Box>
    );
};

export default Ranking;