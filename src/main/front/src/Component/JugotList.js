import React, { useEffect, useState, useMemo } from 'react';
import StockTable from './StockTable';

const JugotList = () => {
    // 모든 주차 데이터를 저장할 상태
    const [allWeeksData, setAllWeeksData] = useState({});
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    // 현재 표시할 월 인덱스 (0부터 시작)
    const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

    // 최근 6개월의 year와 month 배열 생성
    // 현재 날짜를 함수 내부에서 계산하여 항상 최신 날짜를 사용
    const getRecent6Months = () => {
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                year: date.getFullYear(),
                month: date.getMonth() + 1 // JavaScript는 0-based이므로 +1
            });
        }
        return months;
    };
    
    // JugotService의 computeWeekRangeOfMonth와 동일한 로직
    const computeWeekRangeOfMonth = (year, month, weekInMonth) => {
        // JavaScript month는 0-based이므로 -1
        const jsMonth = month - 1;
        
        // 해당 월의 1일
        const first = new Date(year, jsMonth, 1);
        
        // 해당 월의 첫 월요일 찾기
        let firstMonday = new Date(first);
        const firstDayOfWeek = first.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
        
        if (firstDayOfWeek === 0) { // 일요일인 경우
            firstMonday.setDate(first.getDate() + 1); // 다음날(월요일)
        } else if (firstDayOfWeek > 1) { // 화요일 이후인 경우
            firstMonday.setDate(first.getDate() + (8 - firstDayOfWeek)); // 다음주 월요일
        }
        
        // 해당 주차의 시작일 (월요일)
        const start = new Date(firstMonday);
        start.setDate(firstMonday.getDate() + (weekInMonth - 1) * 7);
        
        // 해당 주차의 종료일 (일요일)
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        
        // 월 경계를 벗어나지 않도록 보정
        const monthStart = new Date(year, jsMonth, 1);
        const monthEnd = new Date(year, jsMonth + 1, 0); // 다음달 0일 = 이번달 마지막일
        
        if (start < monthStart) {
            start.setTime(monthStart.getTime());
        }
        if (end > monthEnd) {
            end.setTime(monthEnd.getTime());
        }
        
        return { start, end };
    };

    // JugotService와 동일한 주차 계산 함수 (월요일 기준)
    const getCurrentWeekOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // JavaScript는 0-based이므로 +1
        
        // 1주차부터 5주차까지 확인하여 현재 날짜가 포함된 주차 찾기
        for (let week = 1; week <= 5; week++) {
            const range = computeWeekRangeOfMonth(year, month, week);
            if (date >= range.start && date <= range.end) {
                return week;
            }
        }
        
        return 1; // 기본값
    };
    

    // 캐시 관련 함수들
    const CACHE_KEY = `jugot_data_recent_6months`;
    const CACHE_DURATION = 30 * 60 * 1000; // 30분 (밀리초)

    const getCachedData = () => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                const now = Date.now();
                
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

    const setCachedData = (data) => {
        try {
            const cacheData = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Error saving cache:', error);
        }
    };

    // 주차별로 데이터를 그룹화하는 함수
    const groupDataByWeek = (allMonthsData) => {
        const weekGroups = {};
        
        // 모든 월의 데이터를 순회하면서 주차별로 그룹화
        Object.entries(allMonthsData).forEach(([monthKey, monthData]) => {
            Object.entries(monthData).forEach(([weekKey, weekData]) => {
                // 주차 키를 "년-월-주차" 형식으로 생성 (연도 포함)
                const globalWeekKey = `${monthKey}-${weekKey}`;
                weekGroups[globalWeekKey] = weekData;
            });
        });
        
        return weekGroups;
    };

    // 월별로 데이터를 그룹화하는 함수
    const groupDataByMonth = (weekGroups) => {
        const monthGroups = {};
        
        Object.entries(weekGroups).forEach(([weekKey, weekData]) => {
            // "년 월-주차" 형식에서 월 부분 추출 (예: "2025년 1월-1주차" -> "2025년 1월")
            const monthKey = weekKey.split('-')[0];
            
            if (!monthGroups[monthKey]) {
                monthGroups[monthKey] = {};
            }
            
            // 주차 키 추출 (예: "2025년 1월-1주차" -> "1주차")
            const weekKeyOnly = weekKey.split('-').slice(1).join('-');
            monthGroups[monthKey][weekKeyOnly] = weekData;
        });
        
        return monthGroups;
    };

    // 월별로 그룹화된 데이터와 월 목록
    const { monthGroups, monthList } = useMemo(() => {
        const grouped = groupDataByMonth(allWeeksData);
        const months = Object.keys(grouped).sort((a, b) => {
            // "년 월" 형식에서 연도와 월 추출하여 정렬
            const matchA = a.match(/(\d+)년\s*(\d+)월/);
            const matchB = b.match(/(\d+)년\s*(\d+)월/);
            
            if (matchA && matchB) {
                const yearA = parseInt(matchA[1]);
                const monthA = parseInt(matchA[2]);
                const yearB = parseInt(matchB[1]);
                const monthB = parseInt(matchB[2]);
                
                if (yearA !== yearB) {
                    return yearB - yearA; // 연도는 내림차순
                }
                return monthB - monthA; // 월은 내림차순
            }
            return 0;
        });
        
        return { monthGroups: grouped, monthList: months };
    }, [allWeeksData]);

    const formatMonthLabel = (monthKey) => {
        const match = monthKey.match(/(\d+)년\s*(\d+)월/);
        if (!match) {
            return monthKey;
        }
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        return `${year % 100}.${month}`;
    };

    // 현재 월의 데이터 가져오기
    const currentMonthData = useMemo(() => {
        if (monthList.length === 0 || currentMonthIndex >= monthList.length) {
            return {};
        }
        const currentMonthKey = monthList[currentMonthIndex];
        return monthGroups[currentMonthKey] || {};
    }, [monthGroups, monthList, currentMonthIndex]);

    // 업데이트 상태 확인
    useEffect(() => {
        const checkUpdateStatus = async () => {
            try {
                const response = await fetch('/api/jugot/update-status');
                if (response.ok) {
                    const data = await response.json();
                    setIsUpdating(data.isUpdating || false);
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
        const fetchRecent6MonthsData = async () => {
            // 업데이트 중이면 데이터를 가져오지 않음
            if (isUpdating) {
                console.log('주가 업데이트 중이므로 데이터를 가져오지 않습니다.');
                return;
            }

            try {
                setLoading(true);
                
                // 먼저 캐시된 데이터가 있는지 확인
                const cachedData = getCachedData();
                if (cachedData) {
                    console.log('캐시된 데이터를 사용합니다.');
                    setAllWeeksData(cachedData);
                    setCurrentMonthIndex(0);
                    setLoading(false);
                    return;
                }

                console.log('새로운 데이터를 가져옵니다.');
                const allMonthsData = {};
                const recentMonths = getRecent6Months();
                
                // 디버깅: 요청할 월 목록 출력
                console.log('최근 6개월 범위:', recentMonths.map(m => `${m.year}년 ${m.month}월`).join(', '));

                // 최근 6개월의 데이터를 가져오기
                for (const { year, month } of recentMonths) {
                    try {
                        const response = await fetch(`/api/jugot/all?year=${year}&month=${month}`);
                        
                        if (response.ok) {
                            const monthData = await response.json();
                            console.log(`${year}년 ${month}월 데이터:`, Object.keys(monthData).length > 0 ? `${Object.keys(monthData).length}개 주차 데이터 있음` : '데이터 없음');
                            if (Object.keys(monthData).length > 0) {
                                // 연도를 포함한 키로 저장 (예: "2025년 1월")
                                allMonthsData[`${year}년 ${month}월`] = monthData;
                            }
                        } else {
                            console.warn(`${year}년 ${month}월 데이터 요청 실패:`, response.status);
                        }
                    } catch (error) {
                        console.error(`Error fetching data for ${year}년 ${month}월:`, error);
                    }
                }
                
                // 주차별로 데이터를 그룹화
                const weekGroups = groupDataByWeek(allMonthsData);
                
                // 데이터를 캐시에 저장
                setCachedData(weekGroups);
                
                setAllWeeksData(weekGroups);
                // 데이터 로드 후 첫 번째 월(가장 최근 월)로 초기화
                setCurrentMonthIndex(0);
                
            } catch (error) {
                console.error('Error fetching recent 6 months data:', error);
                setAllWeeksData({});
            } finally {
                setLoading(false);
            }
        };

        fetchRecent6MonthsData();
    }, [isUpdating]);

    if (loading) {
        return (
            <div>
                <h2>주곳리스트 (최근 6개월)</h2>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 20px',
                    marginTop: '40px',
                    minHeight: '300px'
                }}>
                    <style>
                        {`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                            @keyframes pulse {
                                0%, 100% { opacity: 1; }
                                50% { opacity: 0.5; }
                            }
                            .spinner {
                                border: 4px solid rgba(255, 255, 255, 0.3);
                                border-top: 4px solid #ffffff;
                                border-radius: 50%;
                                width: 50px;
                                height: 50px;
                                animation: spin 1s linear infinite;
                                margin-bottom: 20px;
                            }
                            .loading-text {
                                animation: pulse 1.5s ease-in-out infinite;
                            }
                        `}
                    </style>
                    <div className="spinner"></div>
                    <div className="loading-text" style={{
                        fontSize: '24px',
                        fontWeight: '600',
                        color: '#ffffff',
                        letterSpacing: '1px',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                    }}>
                        주곳 로딩중..
                    </div>
                    <div style={{
                        fontSize: '14px',
                        color: 'rgba(255, 255, 255, 0.9)',
                        marginTop: '12px',
                        fontWeight: '300'
                    }}>
                        데이터를 불러오는 중입니다
                    </div>
                </div>
            </div>
        );
    }

    // 페이지네이션 핸들러
    const handlePreviousMonth = () => {
        if (currentMonthIndex > 0) {
            setCurrentMonthIndex(currentMonthIndex - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonthIndex < monthList.length - 1) {
            setCurrentMonthIndex(currentMonthIndex + 1);
        }
    };

    const handleMonthSelect = (index) => {
        if (index >= 0 && index < monthList.length) {
            setCurrentMonthIndex(index);
        }
    };

    return (
        <div>
            {isUpdating && (
                <div className="update-notification">
                    <div className="mini-spinner"></div>
                    <span>주가 업데이트 중입니다. 잠시만 기다려주세요...</span>
                </div>
            )}
            {monthList.length === 0 ? (
                <p>최근 6개월 데이터가 없습니다.</p>
            ) : (
                <>
                    {/* 페이지네이션 UI */}
                    <div className="pagination-container">
                        <button
                            className="pagination-nav-button"
                            onClick={handlePreviousMonth}
                            disabled={currentMonthIndex === 0}
                        >
                            ←
                        </button>
                        
                        {/* 월별 페이지 번호 */}
                        <div className="pagination-month-buttons">
                            {monthList.map((month, index) => (
                                <button
                                    key={month}
                                    className={`pagination-month-button ${currentMonthIndex === index ? 'active' : ''}`}
                                    onClick={() => handleMonthSelect(index)}
                                >
                                    {formatMonthLabel(month)}
                                </button>
                            ))}
                        </div>
                        
                        <button
                            className="pagination-nav-button"
                            onClick={handleNextMonth}
                            disabled={currentMonthIndex === monthList.length - 1}
                        >
                            →
                        </button>
                    </div>

                    {/* 현재 월의 주차 데이터 표시 */}
                    {Object.keys(currentMonthData).length === 0 ? (
                        <p>{monthList[currentMonthIndex]} 데이터가 없습니다.</p>
                    ) : (
                        Object.entries(currentMonthData)
                            .sort(([a], [b]) => {
                                // 주차 번호 추출하여 내림차순 정렬
                                const weekNumA = parseInt(a.replace('주차', ''));
                                const weekNumB = parseInt(b.replace('주차', ''));
                                return weekNumB - weekNumA;
                            })
                            .map(([weekKey, weekData]) => {
                                const monthKey = monthList[currentMonthIndex];
                                const fullWeekKey = `${monthKey}-${weekKey}`;
                                return (
                                    <StockTable 
                                        key={fullWeekKey}
                                        title={`${fullWeekKey} 주곳`} 
                                        data={weekData} 
                                    />
                                );
                            })
                    )}
                </>
            )}
        </div>
    );
};

export default JugotList;