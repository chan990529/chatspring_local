import React, { useState, useMemo } from 'react';

const StockTable = ({ title, data }) => {
    // 정렬 상태를 관리합니다.
    // key: 정렬 기준이 되는 데이터의 키 (예: 'name', 'current')
    // direction: 'ascending' (오름차순) 또는 'descending' (내림차순)
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    // 경과일 계산 함수 (포착일로부터 오늘까지)
    const calculateDaysElapsed = (captureDateString) => {
        if (!captureDateString) {
            return null;
        }
        try {
            const captureDate = new Date(captureDateString);
            const today = new Date();
            
            // 시간을 00:00:00으로 설정하여 날짜만 비교
            captureDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            
            // 밀리초 차이를 일 단위로 변환
            const diffTime = today.getTime() - captureDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            return diffDays;
        } catch (error) {
            return null;
        }
    };

    // useMemo를 사용하여 data나 sortConfig가 변경될 때만 정렬을 다시 실행합니다.
    // 이는 성능 최적화에 도움이 됩니다.
    const sortedData = useMemo(() => {
        // 경과일을 계산하여 각 항목에 추가
        let sortableData = data.map(item => ({
            ...item,
            daysElapsed: calculateDaysElapsed(item.captureDate)
        }));
        
        if (sortConfig.key !== null) {
            sortableData.sort((a, b) => {
                // a와 b에서 정렬 기준이 되는 값을 가져옵니다.
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];

                // 날짜 필드인 경우 처리
                if (sortConfig.key === 'captureDate') {
                    const dateA = valA ? new Date(valA) : null;
                    const dateB = valB ? new Date(valB) : null;
                    if (!dateA && !dateB) return 0;
                    if (!dateA) return 1;
                    if (!dateB) return -1;
                    const comparison = dateA.getTime() - dateB.getTime();
                    return sortConfig.direction === 'ascending' ? comparison : -comparison;
                }

                // 경과일 필드인 경우 처리
                if (sortConfig.key === 'daysElapsed') {
                    const daysA = valA !== null && valA !== undefined ? Number(valA) : null;
                    const daysB = valB !== null && valB !== undefined ? Number(valB) : null;
                    if (daysA === null && daysB === null) return 0;
                    if (daysA === null) return 1;
                    if (daysB === null) return -1;
                    const comparison = daysA - daysB;
                    return sortConfig.direction === 'ascending' ? comparison : -comparison;
                }

                // 값이 숫자인지 문자인지에 따라 다른 비교 로직을 사용합니다.
                if (typeof valA === 'number' && typeof valB === 'number') {
                    if (valA < valB) {
                        return sortConfig.direction === 'ascending' ? -1 : 1;
                    }
                    if (valA > valB) {
                        return sortConfig.direction === 'ascending' ? 1 : -1;
                    }
                } else {
                    // 문자열 비교
                    const comparison = valA.toString().localeCompare(valB.toString());
                    return sortConfig.direction === 'ascending' ? comparison : -comparison;
                }
                return 0;
            });
        }
        return sortableData;
    }, [data, sortConfig]);

    // 테이블 헤더를 클릭했을 때 호출될 함수
    const requestSort = (key) => {
        let direction = 'ascending';
        // 만약 이미 같은 키로 정렬 중이었다면, 정렬 방향을 반대로 바꿉니다.
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // 현재 정렬 상태에 따라 CSS 클래스를 반환하는 함수
    const getSortClassName = (name) => {
        if (!sortConfig.key || sortConfig.key !== name) {
            return '';
        }
        return sortConfig.direction === 'ascending' ? 'sorted-asc' : 'sorted-desc';
    };

    // 테이블 헤더 데이터 (key는 데이터 객체의 키와 일치해야 합니다)
    const headers = [
        { label: '종목명', key: 'name' },
        { label: '포착일', key: 'captureDate' },
        { label: '경과일', key: 'daysElapsed' },
        { label: '포착가', key: 'capturePrice' },
        { label: '현재가', key: 'currentPrice' },
        { label: '최고가', key: 'highestPrice' },
        { label: '최저가', key: 'lowestPrice' },
        { label : '시장구분', key : 'marketType'}
    ];

    const formatNumber = (num) => {
        if (num === null || num === undefined || isNaN(num)) {
            return '-';
        }
        return num.toLocaleString('ko-KR');
    };

    // 날짜 포맷팅 함수
    const formatDate = (dateString) => {
        if (!dateString) {
            return '-';
        }
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            return dateString;
        }
    };

    // 경과일 포맷팅 함수 (표시용)
    const formatDaysElapsed = (days) => {
        if (days === null || days === undefined) {
            return '-';
        }
        return `${days}일`;
    };

    // 포착가 대비 퍼센트 계산 함수
    const calculatePercentage = (currentPrice, capturePrice) => {
        if (!currentPrice || !capturePrice || capturePrice === 0) {
            return null;
        }
        return ((currentPrice - capturePrice) / capturePrice) * 100;
    };

    // 퍼센트를 포맷팅하는 함수
    const formatPercentage = (percentage) => {
        if (percentage === null || percentage === undefined || isNaN(percentage)) {
            return '';
        }
        const sign = percentage >= 0 ? '+' : '';
        return `${sign}${percentage.toFixed(1)}%`;
    };

    // 가격과 퍼센트를 함께 표시하는 함수
    const formatPriceWithPercentage = (price, capturePrice) => {
        const formattedPrice = formatNumber(price);
        const percentage = calculatePercentage(price, capturePrice);
        const formattedPercentage = formatPercentage(percentage);
        
        if (formattedPercentage) {
            const isPositive = percentage >= 0;
            const colorClass = isPositive ? 'price-up' : 'price-down';
            return (
                <span>
                    {formattedPrice}
                    <span className={colorClass}>({formattedPercentage})</span>
                </span>
            );
        }
        return formattedPrice;
    };

    return (
        <div className="stock-table-container">
            <h3>{title}</h3>
            <table className="stock-table">
                <thead>
                <tr>
                    {headers.map(({ label, key }, idx) => (
                        <th
                            key={key}
                            onClick={() => requestSort(key)}
                            className={`sortable-header ${getSortClassName(key)} ${key === 'name' ? 'sticky-column' : ''}`}
                        >
                            {label}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {/* 정렬된 데이터를 사용하여 테이블 행을 렌더링합니다. */}
                {sortedData.map((item, index) => (
                    <tr key={index}>
                        <td className="sticky-column">{item.name}</td>
                        <td>{formatDate(item.captureDate)}</td>
                        <td>{formatDaysElapsed(item.daysElapsed)}</td>
                        <td>{formatNumber(item.capturePrice)}</td>
                        <td>{formatPriceWithPercentage(item.currentPrice, item.capturePrice)}</td>
                        <td>{formatPriceWithPercentage(item.highestPrice, item.capturePrice)}</td>
                        <td>{formatPriceWithPercentage(item.lowestPrice, item.capturePrice)}</td>
                        <td>{item.marketType || '-'}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default StockTable;