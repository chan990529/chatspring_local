import React, { useEffect, useState, useRef } from 'react';
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
    useMediaQuery,
    Box,
    Grid,
    IconButton,
    Checkbox,
    Button,
    Pagination,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { DateTime } from 'luxon';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CloseImage from './Close.png';
import OpenImage from './Open.png';
import EmptyImage from './Empty.png';
import './Scalping.css';  // CSS 파일을 따로 관리
import ScrollToTop from './ScrollToTop';
import RefreshableGrid from "./RefreshableGrid";
import { Popover } from '@mui/material';
import config from '../../config';

// axios.defaults.baseURL = 'https://scalping.app';

axios.defaults.baseURL = config.API_BASE_URL;


const VirtualTradeCard = ({ trade, selectedFields, onClick, isSelected }) => {
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

    return (
        <Card
            sx={{
                marginBottom: 2,
                backgroundColor:
                    trade.tradeResult === '승리'
                        ? '#3DFF92'
                        : trade.tradeResult === '패배'
                            ? '#FF5675'
                            : trade.tradeResult === ''
                                ? '#f8f9fa'
                                : 'default',
                borderRadius: '12px',
                boxShadow: isSelected ? 'rgba(3, 102, 214, 0.3) 0px 0px 0px 3px' : '0px 4px 6px rgba(0, 0, 0, 0.1)',
                margin: '10px 0',
                cursor: 'pointer',
                position: 'relative',
            }}
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
                    {getMarketTypeLabel(trade.marketType)}
                </Typography>
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
                <Typography><strong>1% 매도가:</strong> {trade.sellPrice1 ? formatNumber(trade.sellPrice1) : 'N/A'}</Typography>
                <Typography><strong>1% 경과시간:</strong> {trade.reachTime1}</Typography>
                {selectedFields['2% 매매내역'] && (
                    <Typography><strong>2% 매도가:</strong> {trade.sellPrice2 ? formatNumber(trade.sellPrice2) : 'N/A'}</Typography>
                )}
                {selectedFields['2% 매매내역'] && (
                    <Typography><strong>2% 경과시간:</strong> {trade.reachTime2}</Typography>
                )}
                {selectedFields['3% 매매내역'] && (
                    <Typography><strong>3% 매도가:</strong> {trade.sellPrice3 ? formatNumber(trade.sellPrice3) : 'N/A'}</Typography>
                )}
                {selectedFields['3% 매매내역'] && (
                    <Typography><strong>3% 경과시간:</strong> {trade.reachTime3}</Typography>
                )}
            </CardContent>
        </Card>
    );
};


const PopoverComponent = ({ openConfig, anchorEl, handleCloseConfig, selectedFields, handleCheckboxChange, handleClearSelection }) => (
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
                borderRadius: 2
            }
        }}
    >
        <Box sx={{ mb: 2 }}>
            <Typography variant="h6">표시할 항목 선택</Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
            {Object.keys(selectedFields).map((field) => (
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
        <Box sx={{ display: 'flex', gap: 1 }}>
            <Button fullWidth variant="outlined" onClick={() => {handleClearSelection(); handleCloseConfig();}}>
                초기화
            </Button>
            <Button fullWidth variant="contained" onClick={handleCloseConfig}>
                확인
            </Button>
        </Box>
    </Popover>
);

const MonitoringAndTrades = () => {
    const isMobile = useMediaQuery('(max-width:600px)');
    const containerRef = useRef(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedFields, setSelectedFields] = useState(() => {
        const savedFields = localStorage.getItem('selectedFields');
        return savedFields ? JSON.parse(savedFields) : {
            '2% 매매내역': true,
            '3% 매매내역': true
        };
    });
    const [sortOrder, setSortOrder] = useState('desc');
    const [resultFilter, setResultFilter] = useState('all');
    const [numBuysFilter, setNumBuysFilter] = useState('all');
    const [selectedTradeIds, setSelectedTradeIds] = useState([]);
    const [openConfig, setOpenConfig] = useState(false);
    const [dateRange, setDateRange] = useState([null, null]); // 날짜 범위
    const [daysFilter, setDaysFilter] = useState('3일'); // 3일치, 5일치 등 선택 필터
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;
    const [searchQuery, setSearchQuery] = useState('');
    const [virtualTrades, setVirtualTrades] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);


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

    const handleClearSelection = () => {
        setSelectedTradeIds([]);
    };

    const handleSortOrderChange = (e) => {
        setSortOrder(e.target.value);
    };

    const handleResultFilterChange = (e) => {
        setResultFilter(e.target.value);
        setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
    };

    useEffect(() => {
        if (!Array.isArray(virtualTrades)) return;

        // 필터링
        const filteredTrades = virtualTrades.filter(trade => {
            const matchesResult =
                resultFilter === 'all' ||
                (resultFilter === '승리' && trade.tradeResult === '승리') ||
                (resultFilter === '패배' && trade.tradeResult === '패배') ||
                (resultFilter === 'none' && !trade.tradeResult);

            return matchesResult;
        });

        // 새로운 총 페이지 수 계산
        const newTotalPages = Math.ceil(filteredTrades.length / itemsPerPage);
        setTotalPages(newTotalPages);

        // 현재 페이지가 새로운 총 페이지 수보다 크면 마지막 페이지로 조정
        if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
        }
    }, [resultFilter, virtualTrades, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
    }, [numBuysFilter]);

    const fetchTrades = () => {
        let endDateValue = DateTime.now().setZone('Asia/Seoul').toISODate();
        let startDateValue;

        if (daysFilter === '3일') {
            startDateValue = DateTime.now().setZone('Asia/Seoul').minus({ days: 2 }).toISODate();
        } else if (daysFilter === '5일') {
            startDateValue = DateTime.now().setZone('Asia/Seoul').minus({ days: 4 }).toISODate();
        } else if (daysFilter === '구간' && startDate && endDate) {
            // 구간 선택의 경우 시작일과 종료일을 직접 사용
            startDateValue = DateTime.fromJSDate(startDate).toISODate();
            endDateValue = DateTime.fromJSDate(endDate).toISODate();
        } else {
            // 기본값 설정
            startDateValue = endDateValue;
        }

        // URL에 명시적으로 날짜 범위 추가
        const url = new URL('/api/trades', axios.defaults.baseURL);
        url.searchParams.append('date', startDateValue);
        url.searchParams.append('startDate', startDateValue);
        url.searchParams.append('endDate', endDateValue);

        // 검색어가 있는 경우 추가
        if (searchQuery.trim()) {
            url.searchParams.append('search', searchQuery);
        }

        setIsSearching(true);
        axios.get(url.toString())
            .then(response => {
                const allTrades = Array.isArray(response.data) ? response.data : (response.data.trades || []);
                // 날짜 필터링 추가 검증
                const filteredTrades = allTrades.filter(trade => {
                    const tradeDate = DateTime.fromISO(trade.buyTime);
                    return tradeDate >= DateTime.fromISO(startDateValue) &&
                        tradeDate <= DateTime.fromISO(endDateValue);
                });
                setVirtualTrades(filteredTrades);
                setIsSearching(false);
            })
            .catch(error => {
                console.error('There was an error fetching the trades!', error);
                setIsSearching(false);
            });
    };

    const getFilteredAndSortedTrades = (trades) => {
        if (!Array.isArray(trades)) return [];

        // 1. 매매 결과 필터링
        const filteredByResult = trades.filter(trade =>
            resultFilter === 'all' ||
            (resultFilter === '승리' && trade.tradeResult === '승리') ||
            (resultFilter === '패배' && trade.tradeResult === '패배') ||
            (resultFilter === 'none' && !trade.tradeResult)
        );

        // 2. 매매 횟수 필터링
        const filteredByNumBuys = filteredByResult.filter(trade => {
            if (numBuysFilter === 'all') return true;
            if (numBuysFilter === '10') return trade.numBuys === 10;
            return true;
        });

        // 3. 정렬
        const sortedTrades = filteredByNumBuys.sort((a, b) =>
            sortOrder === 'asc'
                ? new Date(a.buyTime) - new Date(b.buyTime)
                : new Date(b.buyTime) - new Date(a.buyTime)
        );

        // 4. 전체 페이지 수 업데이트
        const newTotalPages = Math.ceil(sortedTrades.length / itemsPerPage);
        if (totalPages !== newTotalPages) {
            setTotalPages(newTotalPages);
        }

        // 5. 현재 페이지 데이터만 반환
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;

        return sortedTrades.slice(start, end);
    };

// useEffect 추가하여 필터 변경 시 페이지 리셋
    useEffect(() => {
        setCurrentPage(1);
    }, [resultFilter]);

    // 검색어 변경 시에만 디바운스 적용
    useEffect(() => {
        if (searchQuery.trim() !== '') {
            const delayDebounceFn = setTimeout(() => {
                fetchTrades();
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [searchQuery]);

    // 다른 필터 변경 시에는 즉시 검색
    useEffect(() => {
        if (daysFilter !== '구간' || (startDate && endDate)) {
            fetchTrades();
        }
    }, [refreshKey, daysFilter, startDate, endDate, currentPage]);

    const handleSearch = () => {
        fetchTrades();
        setCurrentPage(1);
    };

    useEffect(() => {
        fetchTrades();
    }, [refreshKey, daysFilter, dateRange, currentPage]);


    const handleDaysFilterChange = (e) => {
        setDaysFilter(e.target.value);
        setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동

        // 구간 선택이 아닐 경우 시작일과 종료일 초기화
        if (e.target.value !== '구간') {
            setStartDate(null);
            setEndDate(null);
        }
    };



    const handlePageChange = (event, value) => {
        setCurrentPage(value);
    };

    const refreshTrades = () => {
        setRefreshKey((prevKey) => prevKey + 1);
    };

    const handleOpenConfig = (event) => {
        setAnchorEl(event.currentTarget);
        setOpenConfig(true);
    };

    const handleCloseConfig = () => {
        setAnchorEl(null);
        setOpenConfig(false);
    };

    return (
        <Box component="div" sx={{height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
            <Box ref={containerRef} sx={{flex: 1, padding: 2, overflowY: 'auto', position: 'relative'}}>
                {/* 날짜 필터 부분 */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',  // 이 줄 추가
                    marginBottom: 2,
                    flexWrap: 'wrap',
                    gap: 2,
                    width: '100%'  // 이 줄 추가
                }}>
                    <RadioGroup row value={daysFilter} onChange={handleDaysFilterChange}>
                        <FormControlLabel value="3일" control={<Radio/>} label="3일치"/>
                        <FormControlLabel value="5일" control={<Radio/>} label="5일치"/>
                        <FormControlLabel value="구간" control={<Radio/>} label="구간 지정"/>
                    </RadioGroup>
                    {daysFilter === '구간' && (
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1}}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                                    <DatePicker
                                        value={startDate}
                                        onChange={(newValue) => setStartDate(newValue)}
                                        slots={{
                                            textField: (params) =>
                                                <TextField
                                                    {...params}
                                                    sx={{
                                                        width: '50px',
                                                        '& .MuiInputBase-input': {
                                                            fontSize: '0.3rem',
                                                            padding: '10px'
                                                        }
                                                    }}
                                                />
                                        }}
                                        maxDate={endDate || new Date()}
                                    />
                                    <Box sx={{mx: 2}}>~</Box>
                                    <DatePicker
                                        value={endDate}
                                        onChange={(newValue) => setEndDate(newValue)}
                                        slots={{
                                            textField: (params) =>
                                                <TextField
                                                    {...params}
                                                    sx={{
                                                        width: '50px',
                                                        '& .MuiInputBase-input': {
                                                            fontSize: '0.3rem',
                                                            padding: '10px'
                                                        }
                                                    }}
                                                />
                                        }}
                                        minDate={startDate}
                                        maxDate={new Date()}
                                    />
                                </Box>
                            </LocalizationProvider>
                        </Box>
                    )}
                </Box>

                <Grid container spacing={2} direction={isMobile ? 'column' : 'row'} justifyContent="center">
                    <Grid item xs={12} md={6}>
                        {/* 시간 정렬 라디오 그룹 */}
                        <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                            <RadioGroup row value={sortOrder} onChange={handleSortOrderChange}>
                                <FormControlLabel value="asc" control={<Radio />} label="시간 정순" />
                                <FormControlLabel value="desc" control={<Radio />} label="시간 역순" />
                            </RadioGroup>
                            <IconButton onClick={handleOpenConfig} sx={{ marginLeft: 1 }}>
                                <SettingsIcon />
                            </IconButton>
                        </Box>
                        <PopoverComponent
                            openConfig={openConfig}
                            anchorEl={anchorEl}
                            handleCloseConfig={handleCloseConfig}
                            selectedFields={selectedFields}
                            handleCheckboxChange={handleCheckboxChange}
                            handleClearSelection={handleClearSelection}
                        />
                        {/* 매매 결과 필터 */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between', // 요소 간의 간격 균형 있게 배치
                                gap: 2, // 요소 간 간격
                                flexWrap: 'wrap' // 화면이 좁을 경우 줄 바꿈
                            }}
                        >
                            <FormControl sx={{ flex: 1 }} margin="normal">
                                <InputLabel>매매 결과 필터</InputLabel>
                                <Select
                                    value={resultFilter}
                                    onChange={handleResultFilterChange}
                                    label="매매 결과 필터"
                                >
                                    <MenuItem value="all">전체</MenuItem>
                                    <MenuItem value="승리">승리</MenuItem>
                                    <MenuItem value="패배">패배</MenuItem>
                                    <MenuItem value="none">진행중</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl sx={{ flex: 1 }} margin="normal">
                                <InputLabel>매매 횟수 필터</InputLabel>
                                <Select
                                    value={numBuysFilter}
                                    onChange={(e) => setNumBuysFilter(e.target.value)}
                                    label="매매 횟수 필터"
                                >
                                    <MenuItem value="all">전체</MenuItem>
                                    <MenuItem value="10">10회</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* 검색창 */}
                        {/*<TextField*/}
                        {/*    label="종목명 검색"*/}
                        {/*    variant="outlined"*/}
                        {/*    fullWidth*/}
                        {/*    margin="normal"*/}
                        {/*    value={searchQuery}*/}
                        {/*    onChange={(e) => setSearchQuery(e.target.value)}*/}
                        {/*    disabled={isSearching}*/}
                        {/*    sx={{*/}
                        {/*        marginBottom: 2,*/}
                        {/*        '& .MuiOutlinedInput-root': {*/}
                        {/*            borderRadius: '12px',*/}
                        {/*        }*/}
                        {/*    }}*/}
                        {/*/>*/}

                        {/* 검색 결과 표시 */}
                        {isSearching ? (
                            <Typography>검색 중...</Typography>
                        ) : virtualTrades.length > 0 ? (
                            getFilteredAndSortedTrades(virtualTrades).map((trade) => (
                                <VirtualTradeCard
                                    key={trade.tradeId}
                                    trade={trade}
                                    selectedFields={selectedFields}
                                    onClick={() => setSelectedTradeIds([...selectedTradeIds, trade.tradeId])}
                                    isSelected={selectedTradeIds.includes(trade.tradeId)}
                                />
                            ))
                        ) : (
                            <Typography>해당 종목이 없습니다.</Typography>
                        )}

                        {/* 페이지네이션 */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
                            <Pagination
                                count={totalPages}
                                page={currentPage}
                                onChange={handlePageChange}
                                color="primary"
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Box>
            <ScrollToTop scrollRef={containerRef} />
            <RefreshableGrid onRefresh={refreshTrades} />
        </Box>
    );
};

export default MonitoringAndTrades;
