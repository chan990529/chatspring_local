import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config';
import '../Pages/jugot/jugot.css';

const PersonalTrade = () => {
    const [participants, setParticipants] = useState([]);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [trades, setTrades] = useState([]);
    const [loadingParticipants, setLoadingParticipants] = useState(true);
    const [loadingTrades, setLoadingTrades] = useState(false);
    const [error, setError] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // 반응형 처리
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            <div className="content">
                <p>로딩 중...</p>
            </div>
        );
    }

    if (error && participants.length === 0) {
        return (
            <div className="content">
                <p style={{ color: '#ff6b6b' }}>{error}</p>
            </div>
        );
    }

    return (
        <div className="content">

            <div style={{
                display: 'flex',
                gap: '20px',
                flexDirection: isMobile ? 'column' : 'row'
            }}>
                {/* 좌측: 참여자 목록 */}
                <div style={{
                    flex: isMobile ? '1' : '0 0 300px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    borderRadius: '15px',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
                    padding: '20px',
                    maxHeight: '600px',
                    overflowY: 'auto'
                }}>
                    <h3 style={{
                        marginTop: '0',
                        marginBottom: '15px',
                        color: '#fff',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                        paddingBottom: '10px'
                    }}>
                        참여자 목록
                    </h3>
                    {participants.length === 0 ? (
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', padding: '20px' }}>
                            참여자가 없습니다.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {participants.map((participant, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleParticipantClick(participant.name)}
                                    style={{
                                        padding: '12px 15px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        backgroundColor: selectedParticipant === participant.name
                                            ? 'rgba(255, 255, 255, 0.2)'
                                            : 'rgba(255, 255, 255, 0.05)',
                                        border: selectedParticipant === participant.name
                                            ? '2px solid rgba(255, 255, 255, 0.4)'
                                            : '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#fff'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedParticipant !== participant.name) {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedParticipant !== participant.name) {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                        }
                                    }}
                                >
                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                        {participant.name}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                                        참여 {participant.totalCount}건
                                        {participant.activeCount > 0 && (
                                            <span style={{ marginLeft: '8px', color: 'rgba(76, 175, 80, 0.9)' }}>
                                                · 진행중 {participant.activeCount}건
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 우측: 선택된 참여자의 실매매 목록 */}
                <div style={{
                    flex: '1',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    borderRadius: '15px',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
                    padding: '20px'
                }}>
                    {!selectedParticipant ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                            <p style={{ fontSize: '16px', margin: '0' }}>
                                참여자를 선택하면 참여 중인 실매매가 표시됩니다.
                            </p>
                        </div>
                    ) : loadingTrades ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                            <p>로딩 중...</p>
                        </div>
                    ) : error ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: '#ff6b6b'
                        }}>
                            <p>{error}</p>
                        </div>
                    ) : trades.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                            <p style={{ fontSize: '16px', margin: '0' }}>
                                <strong style={{ color: '#fff' }}>{selectedParticipant}</strong>님이 참여 중인 실매매가 없습니다.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <h3 style={{
                                marginTop: '0',
                                marginBottom: '15px',
                                color: '#fff',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                                paddingBottom: '10px'
                            }}>
                                {selectedParticipant}님의 실매매 현황
                            </h3>
                            <div className="stock-table-container" style={{ marginTop: '0', padding: '0' }}>
                                <table className="stock-table">
                                    <thead>
                                        <tr>
                                            <th>종목명</th>
                                            <th>종목코드</th>
                                            <th>시작일</th>
                                            <th>수익률</th>
                                            <th>상태</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trades.map((trade) => {
                                            const returnRate = calculateReturnRate(trade);
                                            const returnRateFormatted = formatReturnRate(returnRate);
                                            const returnRateColor = returnRate != null 
                                                ? (returnRate >= 0 ? '#ff6b6b' : '#4ecdc4')
                                                : 'rgba(255, 255, 255, 0.7)';
                                            
                                            return (
                                                <tr key={trade.id}>
                                                    <td>{trade.stockName || '-'}</td>
                                                    <td>{trade.stockCode || '-'}</td>
                                                    <td>{formatDate(trade.startDate)}</td>
                                                    <td style={{ 
                                                        color: returnRateColor,
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {returnRateFormatted}
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            backgroundColor: trade.status === 'ACTIVE'
                                                                ? 'rgba(76, 175, 80, 0.3)'
                                                                : trade.status === 'PAUSED'
                                                                ? 'rgba(255, 193, 7, 0.3)'
                                                                : trade.status === 'COMPLETED'
                                                                ? 'rgba(158, 158, 158, 0.3)'
                                                                : 'rgba(158, 158, 158, 0.3)',
                                                            color: '#fff',
                                                            fontSize: '12px'
                                                        }}>
                                                            {trade.status === 'ACTIVE'
                                                                ? '진행중'
                                                                : trade.status === 'PAUSED'
                                                                ? '중단'
                                                                : trade.status === 'COMPLETED'
                                                                ? '완료'
                                                                : trade.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                
                                {/* 종합수익률 표시 */}
                                {trades.length > 0 && (() => {
                                    const totalReturnRate = calculateTotalReturnRate();
                                    const totalReturnRateFormatted = formatReturnRate(totalReturnRate);
                                    const totalReturnRateColor = totalReturnRate != null 
                                        ? (totalReturnRate >= 0 ? '#ff6b6b' : '#4ecdc4')
                                        : 'rgba(255, 255, 255, 0.7)';
                                    
                                    return (
                                        <div style={{
                                            marginTop: '20px',
                                            padding: '15px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ 
                                                fontSize: '16px', 
                                                fontWeight: 'bold',
                                                color: '#fff'
                                            }}>
                                                종합수익률
                                            </div>
                                            <div style={{ 
                                                fontSize: '20px', 
                                                fontWeight: 'bold',
                                                color: totalReturnRateColor
                                            }}>
                                                {totalReturnRateFormatted}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PersonalTrade;
