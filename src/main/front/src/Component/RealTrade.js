import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config';
import '../Pages/jugot/jugot.css';

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

    if (loading) {
        return (
            <div className="content">
                <h2>Real Trade</h2>
                <p>로딩 중...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="content">
                <h2>실매매</h2>
                <p style={{ color: '#ff6b6b' }}>{error}</p>
            </div>
        );
    }

    return (
        <div className="content">
            <h2>실매매</h2>
            {isUpdating && (
                <div style={{
                    padding: '12px',
                    marginBottom: '20px',
                    backgroundColor: '#ff9800',
                    color: '#fff',
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontWeight: 'bold'
                }}>
                    주가 업데이트 중입니다. 잠시만 기다려주세요...
                </div>
            )}
            <p style={{ marginBottom: '20px', color: 'rgba(255, 255, 255, 0.8)' }}>
                진행 중인 실매매 현황을 확인할 수 있습니다.
                {isLoggedIn && <span style={{ display: 'block', marginTop: '8px', fontSize: '14px', color: 'rgba(76, 175, 80, 0.8)' }}>
                    종목을 클릭하여 참여하거나 취소할 수 있습니다.
                </span>}
            </p>

            {realTrades.length === 0 ? (
                <div className="stock-table-container">
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', padding: '20px' }}>
                        진행 중인 실매매가 없습니다.
                    </p>
                </div>
            ) : (
                <div className="stock-table-container">
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th>종목명</th>
                                <th>종목코드</th>
                                <th>평단가</th>
                                <th>시작일</th>
                                <th>경과일</th>
                                <th>매수 횟수</th>
                                <th>참여자</th>
                                <th>상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            {realTrades.map((trade) => {
                                const participantNicknames = getParticipantNicknames(trade.participants);
                                const isUserParticipating = participantNicknames.includes(currentUserNickname);
                                
                                return (
                                <tr 
                                    key={trade.id}
                                    onClick={() => handleStockClick(trade.id, trade.participants)}
                                    style={{
                                        cursor: isLoggedIn ? 'pointer' : 'default',
                                        transition: 'background-color 0.2s',
                                        // 내가 참여 중인 항목 강조 (배경색 미세하게 변경)
                                        backgroundColor: isUserParticipating 
                                            ? 'rgba(76, 175, 80, 0.15)' 
                                            : undefined
                                    }}
                                    onMouseEnter={(e) => {
                                        if (isLoggedIn) {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        // 마우스가 벗어날 때 원래 배경색으로 복원 (참여 중이면 강조 색상)
                                        if (isUserParticipating) {
                                            e.currentTarget.style.backgroundColor = 'rgba(76, 175, 80, 0.15)';
                                        } else {
                                            e.currentTarget.style.backgroundColor = '';
                                        }
                                    }}
                                >
                                    <td>{trade.stockName || '-'}</td>
                                    <td>{trade.stockCode || '-'}</td>
                                    <td>{formatAveragePriceWithProfit(trade.averagePrice, trade.buyPrice, trade.currentPrice)}</td>
                                    <td>{formatDate(trade.startDate)}</td>
                                    <td>{formatDaysElapsed(calculateDaysElapsed(trade.startDate))}</td>
                                    <td>{trade.currentBuyCount || 0}</td>
                                    <td 
                                        style={{ 
                                            position: 'relative'
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {participantNicknames.length > 0 ? (
                                            <button
                                                onClick={(e) => handleViewMembers(e, trade.participants, trade.stockName)}
                                                style={{
                                                    padding: '4px 12px',
                                                    backgroundColor: 'rgba(76, 175, 80, 0.3)',
                                                    color: '#fff',
                                                    border: '1px solid rgba(76, 175, 80, 0.5)',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'rgba(76, 175, 80, 0.5)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'rgba(76, 175, 80, 0.3)';
                                                }}
                                            >
                                                보기 ({participantNicknames.length}명)
                                            </button>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            backgroundColor: trade.status === 'ACTIVE' 
                                                ? 'rgba(76, 175, 80, 0.3)' 
                                                : trade.status === 'PAUSED'
                                                ? 'rgba(255, 152, 0, 0.3)'
                                                : trade.status === 'COMPLETED'
                                                ? 'rgba(158, 158, 158, 0.3)'
                                                : 'rgba(158, 158, 158, 0.3)',
                                            color: '#fff',
                                            fontSize: '12px',
                                            border: `1px solid ${trade.status === 'ACTIVE' 
                                                ? 'rgba(76, 175, 80, 0.5)' 
                                                : trade.status === 'PAUSED'
                                                ? 'rgba(255, 152, 0, 0.5)'
                                                : trade.status === 'COMPLETED'
                                                ? 'rgba(158, 158, 158, 0.5)'
                                                : 'rgba(158, 158, 158, 0.5)'}`
                                        }}>
                                            {trade.status === 'ACTIVE' ? '진행중' : trade.status === 'PAUSED' ? '중단' : trade.status === 'COMPLETED' ? '완료' : trade.status}
                                        </span>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 참여자 목록 모달 */}
            {modalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000
                    }}
                    onClick={handleCloseModal}
                >
                    <div
                        style={{
                            backgroundColor: '#1e1e1e',
                            borderRadius: '8px',
                            padding: '24px',
                            maxWidth: '500px',
                            width: '90%',
                            maxHeight: '80vh',
                            overflow: 'auto',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            paddingBottom: '12px'
                        }}>
                            <h3 style={{
                                margin: 0,
                                color: '#fff',
                                fontSize: '18px'
                            }}>
                                {selectedStockName} 참여자 목록
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    padding: '0',
                                    width: '30px',
                                    height: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '4px',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            marginBottom: '16px',
                            fontSize: '14px'
                        }}>
                            총 {selectedMembers.length}명
                        </div>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }}>
                            {selectedMembers.length > 0 ? (
                                selectedMembers.map((member, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            padding: '12px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            borderRadius: '4px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}
                                    >
                                        {index + 1}. {member}
                                    </div>
                                ))
                            ) : (
                                <div style={{
                                    padding: '20px',
                                    textAlign: 'center',
                                    color: 'rgba(255, 255, 255, 0.6)'
                                }}>
                                    참여자가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RealTrade;
