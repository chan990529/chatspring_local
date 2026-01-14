import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import {
    TextField,
    Typography,
    RadioGroup,
    FormControlLabel,
    Radio,
    Card,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CardContent,
    Avatar,
    Box,
    Grid,
    IconButton,
    Checkbox,
    Button,
    Autocomplete
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseImage from './Close.png';
import OpenImage from './Open.png';
import EmptyImage from './Empty.png';
import './Scalping.css';  // CSS 파일을 따로 관리
import ScrollToTop from './ScrollToTop';
import RefreshableGrid from "./RefreshableGrid";
import { Popover} from '@mui/material';
import Switch from '@mui/material/Switch';
import StockstatusCard from './StockstatusCard'; // 작성한 컴포넌트 import
import { useQuery } from '@tanstack/react-query';
import StockChart from './StockChart.jsx';
import config from '../../config';




axios.defaults.baseURL = config.API_BASE_URL;
const TitleText = ({ tradeStats }) => {
    const {
        winRate = 0, lossRate = 0, ongoingRate = 0,
        // 수정: 건수 디폴트 값 추가
        winCount = 0, lossCount = 0, ongoingCount = 0
    } = tradeStats || {};

    return (
        <Card sx={{ marginBottom: 2 }}>
            <CardContent>

                {/* 위엄있는 텍스트 추가 */}
                <Typography
                    variant="subtitle1"
                    sx={{
                        marginTop: 2,
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#333',
                        fontFamily: 'Lee',
                        fontSize: 'clamp(18px, 2.5vw, 30px)' // 최소 14px, 선호 2.5vw, 최대 20px,
                    }}
                >
                    긴가민가할 때 팔자, <br />시세를 줬으면 진작에 줬다
                </Typography>

                <Typography variant="h6" sx={{ marginTop: 2, marginBottom: 1 }}>오늘의 매매 결과 점유율</Typography>

                {/* 누적 프로그래스바 */}
                <Box sx={{ position: 'relative', height: 30, backgroundColor: '#f0f0f0', borderRadius: 5, overflow: 'hidden' }}>
                    <Box
                        sx={{
                            width: `${winRate}%`,
                            backgroundColor: '#4caf50', // 승리 색상
                            height: '100%',
                            display: 'inline-block',
                        }}
                    />
                    <Box
                        sx={{
                            width: `${lossRate}%`,
                            backgroundColor: '#f44336', // 패배 색상
                            height: '100%',
                            display: 'inline-block',
                        }}
                    />
                    <Box
                        sx={{
                            width: `${ongoingRate}%`,
                            backgroundColor: '#2196f3', // 진행중 색상
                            height: '100%',
                            display: 'inline-block',
                        }}
                    />
                </Box>

                {/* 레이블 표시 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
                    <Typography sx={{ color: '#4caf50' }}>승리: {winRate}%</Typography>
                    <Typography sx={{ color: '#f44336' }}>패배: {lossRate}%</Typography>
                    <Typography sx={{ color: '#2196f3' }}>진행중: {ongoingRate}%</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 0.5 }}>
                    <Typography sx={{ color: '#4caf50' }}>승리건수: {winCount}건</Typography>
                    <Typography sx={{ color: '#f44336' }}>패배건수: {lossCount}건</Typography>
                    <Typography sx={{ color: '#2196f3' }}>진행건수: {ongoingCount}건</Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

const VirtualTradeCard = ({ trade, selectedFields, onClick, isSelected, onSearch }) => {
    const [anchorEl, setAnchorEl] = useState(null);

    const handlePopoverOpen = (event) => {
        event.stopPropagation(); // 이벤트 전파 차단
        setAnchorEl(event.currentTarget);
    };

    const handlePopoverClose = (event) => {
        event.stopPropagation(); // 이벤트 전파 차단
        setAnchorEl(null);
    };

    const isPopoverOpen = Boolean(anchorEl);

    let tradeResultImage = CloseImage;
    if (trade.tradeResult === '승리') {
        tradeResultImage = OpenImage;
    } else if (trade.tradeResult === '패배') {
        tradeResultImage = EmptyImage;
    }

    const formatNumber = (value) => {
        return new Intl.NumberFormat('ko-KR').format(value);
    };





    const buyTimeDate = new Date(trade.buyTime);
    const isBefore920 = buyTimeDate.getHours() < 9 || (buyTimeDate.getHours() === 9 && buyTimeDate.getMinutes() < 20);



    // 수정: 분 단위로 환산해서 11:30~13:00 사이인지 판단
    const minutes = buyTimeDate.getHours() * 60 + buyTimeDate.getMinutes(); // 수정: 시간→분
    const isPink = minutes >= (11 * 60 + 30) && minutes <= (13 * 60);          // 수정: 690~780분

    // 송곳 90일 구분
    const isSonggot = (() => {
        if (!trade.songgotDate) return false       // songgotDate 없으면 false
        const listingDate = new Date(trade.songgotDate)
        if (isNaN(listingDate)) return false       // 파싱 실패 시 false
        const diffMs = Date.now() - listingDate.getTime()
        const diffDays = diffMs / (1000 * 60 * 60 * 24)
        return diffDays < 90                       // 90일 미만이면 true
    })()

    const isNewlyListed = (() => {
        if (!trade.listingDate) return false; // listingDate가 없으면 false
        const listingDate = new Date(trade.listingDate);
        if (isNaN(listingDate.getTime())) return false; // 유효하지 않은 날짜면 false
        const diffMs = Date.now() - listingDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return diffDays > 10 && diffDays < 120; // 10일 초과, 120일 미만이면 true
    })();

    const getMarketTypeLabel = (marketType) => {
        switch (marketType) {
            case "KOSPI":
                return "코스피";
            case "KOSDAQ":
                return "코스닥";
            default:
                return marketType;
        }
    };

    const timeDifferenceInMinutes = (new Date() - buyTimeDate) / (1000 * 60);
    const shouldHighlight = !trade.tradeResult && timeDifferenceInMinutes > 70;

    const formatDuration = (duration) => duration ? duration.split('.')[0] : '';

    return (
        <Card
            sx={{
                marginBottom: 2,
                backgroundColor:
                // 수정: finalProfit < -2.5 조건을 최우선으로 적용
                    (trade.finalProfit < -2.5 && (trade.tradeResult === null || trade.tradeResult === ''))
                        ? '#000000'
                        // 수정: 그 다음에 시간대 핑크 적용
                        : isPink && (trade.tradeResult === null || trade.tradeResult === '')
                            ? '#FFB6C1'
                            // 이하 기존 로직 유지
                            : trade.tradeResult === '승리'
                                ? '#3DFF92'
                                : trade.tradeResult === '패배'
                                    ? '#FF5675'
                                    : trade.tradeResult === ''
                                        ? '#f8f9fa'
                                        : 'default',
                color : trade.finalProfit < -2.5 && (trade.tradeResult === null || trade.tradeResult === '') ? '#FFFFFF' : 'inherit',
                borderRadius: '12px',
                boxShadow: isSelected ? 'rgba(3, 102, 214, 0.3) 0px 0px 0px 3px' : '0px 4px 6px rgba(0, 0, 0, 0.1)',
                margin: '10px 0',
                cursor: 'pointer',
                position: 'relative',
                border: shouldHighlight ? '5px solid red' : 'none', // Red outline condition
            }}
            onClick={onClick}
        >
            <CardContent>
                {/* 우측 상단 테마 표시 */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <>
                        <Button
                            variant="outlined"
                            size="small"
                            sx={{ fontSize: '0.8rem' }}
                            onClick={handlePopoverOpen} // 팝오버 열기
                        >
                            {trade.theme && trade.theme.length > 10 ? `${trade.theme.slice(0, 10)}...` : (trade.theme || '테마없음')}
                        </Button>
                        <Popover
                            open={isPopoverOpen}
                            anchorEl={anchorEl}
                            onClose={handlePopoverClose} // 팝오버 닫기
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            PaperProps={{
                                sx: {
                                    padding: 2,
                                    maxWidth: 200,
                                },
                            }}
                            onClick={(event) => event.stopPropagation()} // 팝오버 클릭 이벤트 전파 차단
                        >
                            <Typography>{trade.theme}</Typography>
                        </Popover>
                    </>
                </Box>

                {/* 카드 콘텐츠 */}
                <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2, gap: 2 }}>
                    <Typography variant="h6" sx={{ flex: 1, fontWeight: 'bold' }}>
                        <strong>{trade.stockName}</strong>
                    </Typography>
                    <Avatar
                        src={tradeResultImage}
                        alt="매매 결과"
                        sx={{
                            width: 70,
                            height: 80,
                            borderRadius: 0,
                            marginTop: 4, // 이미지를 아래로 내림
                        }}
                    />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* [변경] 종목 경고 상태(stockWarning)를 가장 먼저 표시합니다. */}
                    {trade.stockWarning && (
                        <Typography
                            sx={{
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                color: '#000000', // 진한 빨간색 텍스트
                                border: '2px solid #ef5350',
                                borderRadius: '4px',
                                padding: '2px 8px',
                                display: 'inline-block',
                                backgroundColor: '#ff001a', // 연한 빨간색 배경
                            }}
                        >
                            {trade.stockWarning}
                        </Typography>
                    )}
                    {/* 부모 Box에 gap을 주면 자식들의 marginRight는 모두 제거해도 됩니다. */}
                    <Typography
                        sx={{
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            color: '#000',
                            border: '2px solid #FFD700',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            display: 'inline-block',
                            backgroundColor: '#FFD700',
                            // marginRight: '8px', // 이제 이 속성은 필요 없습니다.
                        }}
                    >
                        {getMarketTypeLabel(trade.marketType)}
                    </Typography>
                    {trade.volumeRatio < 30 && trade.volumeRatio !== null && (
                        <Typography
                            sx={{
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                color: '#000',
                                border: '2px solid #FFD700',
                                borderRadius: '4px',
                                padding: '2px 8px',
                                display: 'inline-block',
                                backgroundColor: '#FFD700',
                            }}
                        >
                            {`전일비 30미만`}
                        </Typography>
                    )}
                    {isNewlyListed && (
                        <Typography
                            sx={{
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                color: '#000',
                                border: '2px solid #FFD700',
                                borderRadius: '4px',
                                padding: '2px 8px',
                                display: 'inline-block',
                                backgroundColor: '#FFD700',
                            }}
                        >
                            {`신규상장`}
                        </Typography>
                    )}
                </Box>
                <Typography><strong>평단가:</strong> {formatNumber(trade.buyPrice)}</Typography>
                <Typography
                    sx={{
                        color: isBefore920 ? '#7b00ff' : 'inherit',
                    }}
                >
                    <strong>매수일:</strong> {buyTimeDate.toLocaleString('ko-KR')}
                </Typography>
                <Typography><strong>매수횟수:</strong> {trade.numBuys}</Typography>
                <Typography><strong>매매결과:</strong> {trade.tradeResult}</Typography>
                <Typography><strong>손절가:</strong> {formatNumber(trade.stopLossPrice)}</Typography>
                <Typography><strong>조건식:</strong> {trade.conditionType}</Typography>
                <Typography><strong>0.7% 매도가:</strong> {trade.sellPrice1 ? formatNumber(trade.sellPrice1) : 'N/A'}</Typography>
                <Typography><strong>0.7% 경과시간:</strong>{' '}{formatDuration(trade.reachTime1)}
                </Typography>
                {selectedFields['2% 매매내역'] && (
                    <Typography><strong>2% 매도가:</strong> {trade.sellPrice2 ? formatNumber(trade.sellPrice2) : 'N/A'}</Typography>
                )}
                {selectedFields['2% 매매내역'] && (
                    <Typography><strong>2% 경과시간:</strong>{' '}{formatDuration(trade.reachTime1)}</Typography>
                )}
                {selectedFields['3% 매매내역'] && (
                    <Typography><strong>3% 매도가:</strong> {trade.sellPrice3 ? formatNumber(trade.sellPrice3) : 'N/A'}</Typography>
                )}
                {selectedFields['3% 매매내역'] && (
                    <Typography><strong>3% 경과시간:</strong>{' '}{formatDuration(trade.reachTime1)}</Typography>
                )}
                {isSonggot && (
                    <Typography
                        variant="body2"
                        sx={{
                            mt: 1,
                            p: '2px 8px',
                            backgroundColor: '#E3F2FD', // 연한 파란색 배경
                            color: '#0D47A1',           // 진한 파란색 텍스트
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            display: 'inline-block'     // 내용물 크기에 맞게 조절
                        }}
                    >
                        90일 내 포착된 송곳의 고둘기 횟수 : {trade.songgotCaptureCountIn90d}회
                    </Typography>
                )}
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                    }}
                >
                    <Button
                        size="small"
                        sx={{
                            backgroundImage: `url("./image/search_btn.png")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            color: 'transparent',
                            width: '50px',
                            height: '60px',
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            // 수정: 객체 대신 문자열(trade.stockName)을 직접 전달합니다.
                            onSearch(trade.stockName);
                        }}
                    >
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

const VirtualTradeTable = ({ refreshKey, selectedFields, onConfigClick, onTradeSelect, selectedTradeIds, setTradeStats, selectedTradesCache, setSelectedTradesCache, onVirtualTradesUpdate, setStockData, setIsLoading, isLoading, setSelectedStockCode, isSonggotOnly }) => {
    const [virtualTrades, setVirtualTrades] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [sortOrder, setSortOrder] = useState('desc');
    const [resultFilter, setResultFilter] = useState('all');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [serverDate, setServerDate] = useState(null);
    const [suggestions, setSuggestions] = useState([]);  // autocomplete 후보



    useEffect(() => {
        async function fetchServerDate() {
            try {
                const response = await axios.get('/api/server-time');
                // 서버에서 받은 ISO 문자열 (예: "2025-03-15T10:00:00Z")
                setServerDate(response.data.serverTime);
            } catch (error) {
                console.error('서버 시간 불러오기 실패:', error);
            }
        }
        fetchServerDate();
    }, []);


    useEffect(() => {
        onVirtualTradesUpdate(virtualTrades);
    }, [virtualTrades, onVirtualTradesUpdate]);



    useEffect(() => {
        const todayTrades = virtualTrades.filter(isTodayTrade);
        calculateTradeStats(todayTrades);
    }, [virtualTrades]);

    useEffect(() => {
        const newCache = {};
        selectedTradeIds.forEach(id => {
            const trade = virtualTrades.find(t => t.tradeId === id);
            if (trade) {
                newCache[id] = trade;
            } else if (selectedTradesCache[id]) {
                newCache[id] = selectedTradesCache[id];
            }
        });
        setSelectedTradesCache(newCache);
    }, [selectedTradeIds, virtualTrades]);

    const fetchTodayTrades = useCallback(async () => {
        if (!serverDate) return; // 서버 시간이 아직 준비되지 않았다면 중단

        setIsLoading(true);
        try {
            // 서버에서 받은 ISO 문자열의 앞 10자리를 잘라 "YYYY-MM-DD" 형식으로 사용
            const today = serverDate.slice(0, 10);
            const response = await axios.get(`/api/trades?date=${today}`);
            setVirtualTrades(response.data);

            const todayTrades = response.data.filter(isTodayTrade);
            calculateTradeStats(todayTrades);
        } catch (error) {
            console.error('거래 내역 불러오기 실패:', error);
        } finally {
            setIsLoading(false);
        }
    }, [serverDate, setIsLoading]);

    useEffect(() => {
        fetchTodayTrades();
    }, [fetchTodayTrades, refreshKey]);

    const isTodayTrade = (trade) => {
        if (!serverDate) return false;
        const tradeDate = new Date(trade.buyTime);
        const serverDay = new Date(serverDate);
        return (
            tradeDate.getFullYear() === serverDay.getFullYear() &&
            tradeDate.getMonth() === serverDay.getMonth() &&
            tradeDate.getDate() === serverDay.getDate()
        );
    };


    const calculateTradeStats = (trades) => {
        const totalTrades = trades.length;
        const wins = trades.filter(trade => trade.tradeResult === '승리').length;
        const losses = trades.filter(trade => trade.tradeResult === '패배').length;
        const ongoing = totalTrades - wins - losses;

        const stats = {
            winRate: ((wins / totalTrades) * 100).toFixed(2) || 0,
            lossRate: ((losses / totalTrades) * 100).toFixed(2) || 0,
            ongoingRate: ((ongoing / totalTrades) * 100).toFixed(2) || 0,
            // 수정: 건수 필드 추가
            winCount: wins,
            lossCount: losses,
            ongoingCount: ongoing,
        };

        setTradeStats(stats);
    };

    // 변경: 전체 검색 로직을 '정확한 종목명 검색' 및 '차트 연동'을 위해 수정
    const handleSearchChange = async (newQuery) => {
        // Autocomplete에서 null 값이 들어오는 경우를 방지
        const currentQuery = newQuery || '';
        setSearchQuery(currentQuery);
        setIsLoading(true);

        const calculateStockData = (trades, stockName) => {
            const captureCount = trades.length;
            const winCount = trades.filter(trade => trade.tradeResult === '승리').length;
            const loseCount = trades.filter(trade => trade.tradeResult === '패배').length;
            const totalRatedTrades = winCount + loseCount;
            const winRate = totalRatedTrades > 0 ? ((winCount / totalRatedTrades) * 100).toFixed(2) : 0;
            const loseTrades = trades.filter(trade => trade.tradeResult === '패배');
            const resistPrice = loseTrades.length > 0
                ? Math.round(loseTrades.reduce((sum, trade) => sum + trade.buyPrice, 0) / loseTrades.length)
                : 0;
            const latestTrade = trades.length > 0 ? trades[trades.length - 1] : null;
            const todayPrice = latestTrade ? latestTrade.buyPrice : 0;
            const minPrice10 = latestTrade ? latestTrade.minPrice10 : 0;
            const minPricedif = todayPrice && minPrice10
                ? parseFloat((((todayPrice - minPrice10) / minPrice10) * 100).toFixed(2))
                : 0;
            return { stockName, captureCount, winCount, loseCount, winRate, resistPrice, minPrice10, minPricedif };
        };



        if (newQuery === '나는천재치맨') {
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1);
            localStorage.setItem('user_auth', JSON.stringify({ expiry: expiryDate }));
            setIsAuthorized(true);
            alert('권한이 부여되었습니다.');
            setSearchQuery('');
            setIsLoading(false);
            return;
        }

        if (newQuery.trim()) {
            try {
                const res = await axios.get(`/api/trades/autocomplete?query=${newQuery}`);
                setSuggestions(res.data);
            } catch (err) {
                console.error('autocomplete error', err);
            }
        } else {
            setSuggestions([]);
        }
        // 2) 기존 검색 로직
        try {
            if (currentQuery.trim() === '') {
                await fetchTodayTrades();
                setStockData({ stockName: '', captureCount: 0, winCount: 0, loseCount: 0, winRate: 0, resistPrice: 0, minPrice10: 0, minPricedif: 0 });
                setSelectedStockCode(null);
                setSuggestions([]);
                return;
            }

            // 1. 유사 검색 (Autocomplete 및 기본 카드 목록용)
            const nameSearchResponse = await axios.get(`/api/trades/search?stockName=${encodeURIComponent(currentQuery)}`);
            const nameSearchResults = nameSearchResponse.data;
            setVirtualTrades(nameSearchResults); // 화면 카드 목록 업데이트
            setSuggestions([...new Set(nameSearchResults.map(t => t.stockName))]); // 자동완성 목록 업데이트

            // 2. 정확히 일치하는 종목 확인
            const exactMatchTrade = nameSearchResults.find(
                (trade) => trade.stockName.toLowerCase() === currentQuery.toLowerCase()
            );

            if (exactMatchTrade) {
                // 3-A. 정확히 일치하는 종목 발견 시
                const { stockName: exactStockName, stockCode } = exactMatchTrade;
                setSelectedStockCode(stockCode); // 차트 렌더링을 위해 부모 컴포넌트에 stockCode 전달

                // 4. 해당 종목의 "모든" 과거 데이터 요청
                const exactNameSearchResponse = await axios.get(`/api/trades/search/by-name-exact?stockName=${encodeURIComponent(exactStockName)}`);
                const allTradesForStock = exactNameSearchResponse.data;

                // 5. 전체 데이터를 기반으로 통계 계산 및 상태 업데이트
                const stockData = calculateStockData(allTradesForStock, exactStockName);
                setStockData(stockData);
            } else {
                // 3-B. 정확히 일치하는 종목이 없을 경우, 통계 및 차트 초기화
                setSelectedStockCode(null);
                setStockData({ stockName: '', captureCount: 0, winCount: 0, loseCount: 0, winRate: 0, resistPrice: 0, minPrice10: 0, minPricedif: 0 });
            }

            // 상단 통계 바는 현재 표시된 (유사 검색) 결과 기반으로 계산
            calculateTradeStats(nameSearchResults.filter(isTodayTrade));

        } catch (error) {
            console.error('Search error:', error);
            setVirtualTrades([]);
            setStockData({ stockName: '검색 중 오류', captureCount: 0, winCount: 0, loseCount: 0, winRate: 0, resistPrice: 0, minPrice10: 0, minPricedif: 0 });
            setSelectedStockCode(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetSearch = async () => {
        setSearchQuery('');
        setIsLoading(true);
        setSelectedStockCode(null); // 추가: 종목 코드 초기화
        try {
            await fetchTodayTrades();
            setStockData({  // 🔹 검색 초기화 버튼을 누르면 stockData도 초기화
                stockName: '',
                captureCount: 0,
                winCount: 0,
                loseCount: 0,
                winRate: 0,
                resistPrice: 0,
                minPrice10 : 0,
                minPricedif : 0,
            });
        } catch (error) {
            console.error('Failed to reset search:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSortOrderChange = (e) => {
        setSortOrder(e.target.value);
    };

    const handleResultFilterChange = (e) => {
        setResultFilter(e.target.value);
    };

    const getFilteredTrades = () => {
        return virtualTrades
            .filter(trade => {
                const matchesSearch = searchQuery.trim() === '' || trade.stockName.toLowerCase() === searchQuery.toLowerCase();
                const matchesResult = resultFilter === 'all' || (resultFilter === '승리' && trade.tradeResult === '승리') || (resultFilter === '패배' && trade.tradeResult === '패배') || (resultFilter === 'none' && !trade.tradeResult);
                const matchesMarketType = selectedFields.marketType === 'all' || trade.marketType === selectedFields.marketType;
                const matchesPriceFilter =
                    !selectedFields.below2000Filter || (selectedFields.below2000Filter && trade.buyPrice >= 2000);
                const serverDay = serverDate ? new Date(serverDate) : new Date();
                const tradeDate = new Date(trade.buyTime);
                const isSameDay = serverDay.getFullYear() === tradeDate.getFullYear() &&
                    serverDay.getMonth() === tradeDate.getMonth() &&
                    serverDay.getDate() === tradeDate.getDate();

                let matchesSonggot = true;
                if (isSonggotOnly) {
                    if (!trade.songgotDate) {
                        matchesSonggot = false;
                    } else {
                        const listingDate = new Date(trade.songgotDate);
                        const diffDays = (Date.now() - listingDate.getTime()) / (1000 * 60 * 60 * 24);
                        matchesSonggot = diffDays < 90;
                    }
                }

                return matchesSearch && matchesSonggot  && matchesResult && matchesMarketType && matchesPriceFilter &&(searchQuery.trim() !== '' || isSameDay);
            })
            .sort((a, b) => sortOrder === 'asc' ? new Date(a.buyTime) - new Date(b.buyTime) : new Date(b.buyTime) - new Date(a.buyTime));
    };

    return (
        <div>
            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                <RadioGroup row value={sortOrder} onChange={handleSortOrderChange}>
                    <FormControlLabel value="asc" control={<Radio />} label="시간 정순" />
                    <FormControlLabel value="desc" control={<Radio />} label="시간 역순" />
                </RadioGroup>
                <IconButton onClick={onConfigClick} sx={{ marginLeft: 1 }}>
                    <SettingsIcon />
                </IconButton>
            </Box>

            <FormControl fullWidth margin="normal">
                <InputLabel>매매 결과 필터</InputLabel>
                <Select value={resultFilter} onChange={handleResultFilterChange} label="매매 결과 필터">
                    <MenuItem value="all">전체</MenuItem>
                    <MenuItem value="승리">승리</MenuItem>
                    <MenuItem value="패배">패배</MenuItem>
                    <MenuItem value="none">진행중</MenuItem>
                </Select>
            </FormControl>

            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                {/* Autocomplete 컴포넌트는 그대로 유지, 핸들러만 교체됨 */}
                <Autocomplete
                    sx={{ flex: 1 }}
                    freeSolo
                    options={suggestions}
                    inputValue={searchQuery}
                    onInputChange={(event, newValue) => {
                        handleSearchChange(newValue);
                    }}
                    onChange={(event, newValue) => {
                        if (newValue) handleSearchChange(newValue);
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="종목명 검색"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                        />
                    )}
                />
                <Button variant="contained" color="secondary" onClick={handleResetSearch} sx={{ marginLeft: 1, height: '56px' }}>
                    초기화
                </Button>
            </Box>

            {/* ... (카드 렌더링 로직은 onSearch 핸들러만 맞게 수정) ... */}
            {selectedTradeIds.map((tradeId) => {
                const selectedTrade = selectedTradesCache[tradeId];
                if (!selectedTrade) return null;
                // 변경: onSearch prop에 함수를 직접 전달
                return (
                    <VirtualTradeCard key={tradeId} trade={selectedTrade} selectedFields={selectedFields} onClick={() => onTradeSelect(selectedTradeIds.filter(id => id !== tradeId))} isSelected={true} onSearch={handleSearchChange} />
                );
            })}

            {!isLoading && getFilteredTrades().length > 0 ? (
                getFilteredTrades().filter(trade => !selectedTradeIds.includes(trade.tradeId)).map((trade) => (
                    <VirtualTradeCard key={trade.tradeId} trade={trade} selectedFields={selectedFields} onSearch={handleSearchChange} onClick={() => onTradeSelect([...selectedTradeIds, trade.tradeId])} isSelected={false} />
                ))
            ) : (
                <Typography>{isLoading ? "검색 중..." : "해당 종목이 없습니다."}</Typography>
            )}
        </div>
    );
};


const MonitoringAndTrades = () => {

    const [selectedStockCode, setSelectedStockCode] = useState(null);

    const fetchDailyStockData = async (stockCode) => {
        if (!stockCode) return null;
        const { data } = await axios.get(`/api/stock-data/daily/${stockCode}`);
        return data;
    };

    const { data: dailyData, isLoading: isDailyDataLoading } = useQuery({
        queryKey: ['dailyStockData', selectedStockCode], // 종목 코드가 키가 됨
        queryFn: () => fetchDailyStockData(selectedStockCode),
        enabled: !!selectedStockCode, // stockCode가 있을 때만 쿼리 실행
        staleTime: 1000 * 60 * 60, // 1시간 동안 캐시 유지
    });


    const [profit1Alert, setProfit1Alert] = useState(() => {
        // 추가: 로컬 스토리지에서 1% 알림 상태 읽어오기
        const saved = localStorage.getItem('profit1Alert');
        return saved ? JSON.parse(saved) : false;
    });

// 추가: 1% 알림 토글 핸들러
    const handleProfit1AlertChange = (event) => {
        const isChecked = event.target.checked;
        setProfit1Alert(isChecked);
        localStorage.setItem('profit1Alert', JSON.stringify(isChecked));
        sendProfit1AlertToServiceWorker(isChecked);
    };

// 추가: 서비스 워커에 1% 알림 상태 전송
    const sendProfit1AlertToServiceWorker = (isChecked) => {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SET_PROFIT1_ALERT',
                profit1Alert: isChecked
            });
        }
    };

    const [tradeStats, setTradeStats] = useState({
        winRate: 0,
        lossRate: 0,
        ongoingRate: 0,
    }); // 초기값 명시

    const [stockData, setStockData] = useState({
        stockName: '',
        captureCount: 0,
        winCount: 0,
        loseCount: 0,
        winRate: 0,
        resistPrice : 0,
        minPrice10 : 0,
        minPricedif : 0,
    });

    // // 검색 완료 플래그
    // const [isSearchComplete, setIsSearchComplete] = useState(false);

    // const isMobile = useMediaQuery('(max-width:600px)');
    const containerRef = useRef(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const [selectedFields, setSelectedFields] = useState(() => {
        const savedFields = localStorage.getItem('selectedFields');
        return savedFields
            ? JSON.parse(savedFields)
            : {
                '2% 매매내역': true,
                '3% 매매내역': true,
                marketType: 'all', // 기본 시장 유형
                below2000Filter: false, // 가격 필터 기본값 (false: 전체, true: 2000원 미만)
            };
    });

    const [virtualTrades, setVirtualTrades] = useState([]); // 추가
    const [selectedTradesCache, setSelectedTradesCache] = useState({}); // 추가

    const [selectedTradeIds, setSelectedTradeIds] = useState(() => {
        const savedSelectedTrades = localStorage.getItem('selectedTradeIds');
        return savedSelectedTrades ? JSON.parse(savedSelectedTrades) : [];
    });


    const [openConfig, setOpenConfig] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const refreshTrades = () => {
        setRefreshKey((prevKey) => prevKey + 1);
    };


    const handleClearSelection = () => {
        setSelectedTradeIds([]);
        localStorage.removeItem('selectedTradeIds');
        localStorage.removeItem('selectedTrades');  // selectedTrades도 함께 제거
    };

    const sendSelectedStockNamesToServiceWorker = (selectedStockNames) => {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SET_SELECTED_STOCKS',
                selectedStockNames: selectedStockNames
            });
        }
    };

    const handleTradeSelect = (newSelectedIds) => {
        setSelectedTradeIds(newSelectedIds);

        // virtualTrades에서 선택된 거래 정보 가져오기
        const selectedTrades = newSelectedIds.map(id => {
            const trade = virtualTrades.find(t => t.tradeId === id);
            if (!trade) return null; // 예외 처리 추가
            return {
                tradeId: id,
                stockName: trade.stockName
            };
        }).filter(trade => trade !== null); // null인 항목 제거

        // 두 정보 모두 저장
        localStorage.setItem('selectedTradeIds', JSON.stringify(newSelectedIds));
        localStorage.setItem('selectedTrades', JSON.stringify(selectedTrades));

        const selectedStockNames = selectedTrades.map(trade => trade.stockName);
        console.log(selectedStockNames);
        sendSelectedStockNamesToServiceWorker(selectedStockNames);
    };

    const handleVirtualTradesUpdate = (trades) => {
        setVirtualTrades(trades);
    };

    const handleCheckboxChange = (event) => {
        const { name, checked } = event.target;
        setSelectedFields((prev) => {
            const updatedFields = {
                ...prev,
                [name]: checked,
            };
            localStorage.setItem('selectedFields', JSON.stringify(updatedFields));
            return updatedFields;
        });
    };

    const [anchorEl, setAnchorEl] = useState(null);

    const handleOpenConfig = (event) => {
        setAnchorEl(event.currentTarget);
        setOpenConfig(true);
    };

    const handleCloseConfig = () => {
        setAnchorEl(null);
        setOpenConfig(false);
    };

    const handleMarketTypeChange = (event) => {
        const { value } = event.target;
        setSelectedFields((prev) => {
            const updatedFields = {
                ...prev,
                marketType: value, // marketType 값 업데이트
            };
            localStorage.setItem('selectedFields', JSON.stringify(updatedFields));
            return updatedFields;
        });
    };

    const getFilteredTrades = () => {
        return virtualTrades
            .filter((trade) => {
                const matchesMarketType =
                    selectedFields.marketType === 'all' ||
                    trade.marketType === selectedFields.marketType;
                return matchesMarketType;
            });
    };


    const [isSonggotOnly, setisSonggotOnly] = useState(() => {
        const saved = localStorage.getItem('isSonggotOnly');
        return saved ? JSON.parse(saved) : false;
    });

    // Add this state to your component
    const [newEntryAlert, setNewEntryAlert] = useState(() => {
        const savedAlert = localStorage.getItem('newEntryAlert');
        return savedAlert ? JSON.parse(savedAlert) : false;
    });

    // Function to handle toggle change
    const handleNewEntryAlertChange = (event) => {
        const isChecked = event.target.checked;
        setNewEntryAlert(isChecked);
        localStorage.setItem('newEntryAlert', JSON.stringify(isChecked));
        sendNewEntryAlertToServiceWorker(isChecked);
    };

    // 스위치 상태 업데이트 함수 (가격 필터)
    const handleBelow2000FilterChange = (event) => {
        const isChecked = event.target.checked;
        setSelectedFields((prev) => {
            const updatedFields = {
                ...prev,
                below2000Filter: isChecked,
            };
            localStorage.setItem('selectedFields', JSON.stringify(updatedFields));
            return updatedFields;
        });
    };


    // Function to send the toggle state to the service worker
    const sendNewEntryAlertToServiceWorker = (isChecked) => {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SET_NEW_ENTRY_ALERT',
                newEntryAlert: isChecked
            });
        }
    };

    // Add this state to your component
    const [wholeAlert, setWholeAlert] = useState(() => {
        const savedAlert = localStorage.getItem('wholeAlert');
        return savedAlert ? JSON.parse(savedAlert) : true;
    });

    // Function to handle toggle change
    const handleWholeAlertChange = (event) => {
        const isChecked = event.target.checked;
        // 전체 알람을 활성화하려 할 때
        if (isChecked) {
            // 알림 권한이 이미 허용되었는지 확인
            if (Notification.permission === "granted") {
                setWholeAlert(true);
                localStorage.setItem('wholeAlert', JSON.stringify(true));
                sendWholeAlertToServiceWorker(true);
            } else if (Notification.permission === "denied") {
                // 권한이 거부된 경우, 사용자에게 안내
                alert("알림 권한이 거부되어 전체 알람을 활성화할 수 없습니다. 브라우저 설정을 확인하세요.");
                // 스위치를 원래대로 되돌림
                setWholeAlert(false);
                localStorage.setItem('wholeAlert', JSON.stringify(false));
                sendWholeAlertToServiceWorker(false);
            } else {
                // 권한이 'default' 상태라면, 즉 아직 결정되지 않은 경우 권한 요청
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        setWholeAlert(true);
                        localStorage.setItem('wholeAlert', JSON.stringify(true));
                        sendWholeAlertToServiceWorker(true);
                    } else {
                        alert("알림 권한이 필요합니다. 알림 권한을 허용하지 않으면 전체 알람을 사용할 수 없습니다.");
                        setWholeAlert(false);
                        localStorage.setItem('wholeAlert', JSON.stringify(false));
                        sendWholeAlertToServiceWorker(false);
                    }
                });
            }
        } else {
            // 전체 알람을 끌 때
            setWholeAlert(false);
            localStorage.setItem('wholeAlert', JSON.stringify(false));
            sendWholeAlertToServiceWorker(false);

            // 전체 알람이 꺼지면 신규 입점 알람도 같이 비활성화
            setNewEntryAlert(false);
            localStorage.setItem('newEntryAlert', JSON.stringify(false));
            sendNewEntryAlertToServiceWorker(false);


            // 1% 알림도 함께 비활성화
            setProfit1Alert(false);
            localStorage.setItem('profit1Alert', JSON.stringify(false));
            sendProfit1AlertToServiceWorker(false);

        }
    };

    // Function to send the toggle state to the service worker
    const sendWholeAlertToServiceWorker = (isChecked) => {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SET_WHOLE_ALERT',
                wholeAlert: isChecked
            });
        }
    };

    const PopoverComponent = () => (
        <Popover
            open={openConfig}
            anchorEl={anchorEl}
            onClose={handleCloseConfig}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            PaperProps={{
                sx: {
                    p: 2,
                    width: 280,
                    borderRadius: 2,
                },
            }}
        >
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6">표시할 항목 선택</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
                {Object.keys(selectedFields)
                    .filter((field) => field !== 'marketType'  && field !== 'below2000Filter') // marketType 제외
                    .map((field) => (
                        <FormControlLabel
                            key={field}
                            control={
                                <Checkbox
                                    checked={selectedFields[field]}
                                    onChange={handleCheckboxChange}
                                    name={field}
                                />
                            }
                            label={field}
                            sx={{ display: 'block', mb: 1 }}
                        />
                    ))}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1">고둘기만 보기</Typography>
                <Switch
                    checked={isSonggotOnly}
                    onChange={(e) => {
                        setisSonggotOnly(e.target.checked);
                        localStorage.setItem('isSonggotOnly', JSON.stringify(e.target.checked));
                    }}
                    color="secondary"
                    sx={{ ml: 1 }}
                />
            </Box>
            <Box sx={{ mb: 2 }}>
                <FormControl fullWidth>
                    <InputLabel>시장 유형 필터</InputLabel>
                    <Select
                        value={selectedFields.marketType}
                        onChange={handleMarketTypeChange}
                        label="시장 유형 필터"
                    >
                        <MenuItem value="all">전체</MenuItem>
                        <MenuItem value="KOSPI">코스피</MenuItem>
                        <MenuItem value="KOSDAQ">코스닥</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            {/* 가격 필터 스위치 추가 */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1">동전주 필터</Typography>
                <Switch
                    checked={selectedFields.below2000Filter}
                    onChange={handleBelow2000FilterChange}
                    name="below2000Filter"
                    color="primary"
                    sx={{ ml: 1 }}
                />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                <Typography variant="body1">전체 알람</Typography>
                <Switch
                    checked={wholeAlert}
                    onChange={handleWholeAlertChange}
                    name="wholeAlert"
                    color="primary"
                />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                <Typography variant="body1">신규 입점 알람</Typography>
                <Switch
                    checked={newEntryAlert}
                    onChange={handleNewEntryAlertChange}
                    name="newEntryAlert"
                    color="primary"
                    disabled={!wholeAlert}
                />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                <Typography variant="body1">1% 알림</Typography>
                <Switch
                    checked={profit1Alert}
                    onChange={handleProfit1AlertChange}
                    name="profit1Alert"
                    color="primary"
                    disabled={!wholeAlert}
                    sx={{ ml: 1 }}
                />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                        handleClearSelection();
                        handleCloseConfig();
                    }}
                >
                    초기화
                </Button>
                <Button fullWidth variant="contained" onClick={handleCloseConfig}>
                    확인
                </Button>
            </Box>
        </Popover>
    );

    return (
        <Box
            component="div"
            sx={{
                height: '100vh',
                overflow: 'hidden', // 변경
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Box
                ref={containerRef}
                sx={{
                    flex: 1,
                    padding: 2,
                    overflowY: 'auto',
                    position: 'relative',
                }}
            >
                <PopoverComponent />
                <Grid container spacing={2} justifyContent="center">
                    {/* 🔹 TitleText는 항상 표시 */}
                    <Grid item xs={12} md={6} container direction="column" spacing={2}>
                        <Grid item>
                            <TitleText tradeStats={tradeStats} />
                        </Grid>

                        {!isLoading && stockData.stockName && (
                            <Grid item>
                                <StockstatusCard
                                    stockName={stockData.stockName}
                                    captureCount={stockData.captureCount}
                                    winCount={stockData.winCount}
                                    loseCount={stockData.loseCount}
                                    winRate={stockData.winRate}
                                    resistPrice={stockData.resistPrice}
                                    minPrice10={stockData.minPrice10}
                                    minPricedif={stockData.minPricedif}
                                    chartData={dailyData}
                                    isChartLoading={isDailyDataLoading}
                                />
                            </Grid>
                        )}
                    </Grid>
                    <Grid
                        item
                        xs={12}
                        md={6}
                        sx={{
                            height: '100%',
                            position: 'relative'
                        }}
                    >
                        <VirtualTradeTable
                            refreshKey={refreshKey}
                            selectedFields={selectedFields}
                            onConfigClick={handleOpenConfig}
                            onTradeSelect={handleTradeSelect} // 수정
                            selectedTradeIds={selectedTradeIds}
                            setTradeStats={setTradeStats} // 비율 업데이트
                            selectedTradesCache={selectedTradesCache}        // 추가
                            setSelectedTradesCache={setSelectedTradesCache}  // 추가
                            onVirtualTradesUpdate={handleVirtualTradesUpdate}
                            setStockData={setStockData} // Pass setStockData here
                            setIsLoading={setIsLoading}
                            isLoading={isLoading} // 추가
                            isSonggotOnly={isSonggotOnly}
                            setSelectedStockCode={setSelectedStockCode}
                        />
                    </Grid>
                </Grid>
            </Box>
            <ScrollToTop scrollRef={containerRef} />
            <RefreshableGrid onRefresh={refreshTrades} />
        </Box>
    );
};

export default MonitoringAndTrades;
