import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import '../Pages/jugot/jugot.css';

const AdminPage = () => {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    
    // 실매매 등록 관련 상태
    const [stockSearchKeyword, setStockSearchKeyword] = useState('');
    const [stockSearchResults, setStockSearchResults] = useState([]);
    const [selectedStock, setSelectedStock] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [investPer, setInvestPer] = useState('');
    const [calculatedTargetBuyCount, setCalculatedTargetBuyCount] = useState(null);
    const [registering, setRegistering] = useState(false);
    const [registerResult, setRegisterResult] = useState(null);
    
    // 실매매 리스트 관련 상태
    const [realTradeList, setRealTradeList] = useState([]);
    const [loadingRealTradeList, setLoadingRealTradeList] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [completingId, setCompletingId] = useState(null);
    const [pausingId, setPausingId] = useState(null);
    const [resumingId, setResumingId] = useState(null);

    // 닉네임 변경 요청 관련 상태
    const [nicknameRequests, setNicknameRequests] = useState([]);
    const [loadingNicknameRequests, setLoadingNicknameRequests] = useState(false);
    const [approvingId, setApprovingId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);

    // 회원가입 승인 요청 관련 상태
    const [signupRequests, setSignupRequests] = useState([]);
    const [loadingSignupRequests, setLoadingSignupRequests] = useState(false);
    const [approvingSignupId, setApprovingSignupId] = useState(null);
    const [rejectingSignupId, setRejectingSignupId] = useState(null);

    // 멤버 리스트 관련 상태
    const [memberList, setMemberList] = useState([]);
    const [loadingMemberList, setLoadingMemberList] = useState(false);

    useEffect(() => {
        // 권한 검증
        const checkAdminAccess = async () => {
            try {
                // 쿠키 방식 사용: localStorage에서 토큰을 읽지 않음
                // 서버에서 사용자 정보 및 권한 확인
                const response = await axios.get(`${config.API_BASE_URL}/api/user/me`, {
                    withCredentials: true // 쿠키 자동 전송
                });

                if (response.data.auth && response.data.role === 'pingddak') {
                    setUserInfo(response.data);
                    setLoading(false);
                } else {
                    setError('관리자 권한이 없습니다.');
                    setLoading(false);
                    setTimeout(() => navigate('/'), 2000);
                }
            } catch (err) {
                setError('권한 확인 중 오류가 발생했습니다.');
                setLoading(false);
                setTimeout(() => navigate('/'), 2000);
            }
        };

        checkAdminAccess();
    }, [navigate]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setUploadResult(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            alert('파일을 선택해주세요.');
            return;
        }

        setUploading(true);
        setUploadResult(null);

        try {
            // 쿠키 방식 사용: localStorage에서 토큰을 읽지 않음
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await axios.post(`${config.API_BASE_URL}/api/jugot/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true // 쿠키 자동 전송
            });

            setUploadResult(response.data);
            
            if (response.data.success) {
                alert(response.data.message || '업로드가 완료되었습니다.');
                setSelectedFile(null);
                // 파일 input 초기화
                document.getElementById('excel-file-input').value = '';
            }
        } catch (err) {
            console.error('업로드 오류:', err);
            let errorMessages = [];
            if (err.response?.data?.errors) {
                if (Array.isArray(err.response.data.errors)) {
                    errorMessages = err.response.data.errors;
                } else {
                    errorMessages = [err.response.data.errors];
                }
            } else if (err.response?.data?.message) {
                errorMessages = [err.response.data.message];
            } else {
                errorMessages = ['업로드 중 오류가 발생했습니다.'];
            }
            setUploadResult({
                success: false,
                errors: errorMessages
            });
        } finally {
            setUploading(false);
        }
    };

    // 종목 검색
    const handleStockSearch = async (keyword) => {
        if (!keyword || keyword.trim().length === 0) {
            setStockSearchResults([]);
            return;
        }

        try {
            // 쿠키 방식 사용: localStorage에서 토큰을 읽지 않음
            const response = await axios.get(`${config.API_BASE_URL}/api/jugot/stocks/search`, {
                params: { keyword: keyword.trim() },
                withCredentials: true // 쿠키 자동 전송
            });

            setStockSearchResults(response.data || []);
        } catch (err) {
            console.error('종목 검색 오류:', err);
            setStockSearchResults([]);
        }
    };

    // 종목 검색 입력 핸들러 (디바운싱)
    useEffect(() => {
        const timer = setTimeout(() => {
            handleStockSearch(stockSearchKeyword);
        }, 300);

        return () => clearTimeout(timer);
    }, [stockSearchKeyword]);

    // 실매매 리스트 조회 (관리자용: ACTIVE + PAUSED)
    const fetchRealTradeList = async () => {
        setLoadingRealTradeList(true);
        try {
            // 쿠키 방식 사용: localStorage에서 토큰을 읽지 않음
            const response = await axios.get(`${config.API_BASE_URL}/api/jugot/realtrade/admin`, {
                withCredentials: true // 쿠키 자동 전송
            });
            setRealTradeList(response.data || []);
        } catch (err) {
            console.error('실매매 리스트 조회 오류:', err);
            setRealTradeList([]);
        } finally {
            setLoadingRealTradeList(false);
        }
    };

    // 멤버 리스트 조회 (관리자용)
    const fetchMemberList = async () => {
        setLoadingMemberList(true);
        try {
            const response = await axios.get(`${config.API_BASE_URL}/api/user/admin/members`, {
                withCredentials: true
            });
            if (response.data.success) {
                setMemberList(response.data.members || []);
            }
        } catch (err) {
            console.error('멤버 리스트 조회 오류:', err);
            setMemberList([]);
        } finally {
            setLoadingMemberList(false);
        }
    };

    // 컴포넌트 마운트 시 실매매 리스트, 닉네임 요청, 멤버 리스트, 회원가입 승인 요청 조회
    useEffect(() => {
        if (userInfo) {
            fetchRealTradeList();
            fetchNicknameRequests();
            fetchMemberList();
            fetchSignupRequests();
        }
    }, [userInfo]);

    // 회원가입 승인 요청 목록 조회
    const fetchSignupRequests = async () => {
        setLoadingSignupRequests(true);
        try {
            const response = await axios.get(`${config.API_BASE_URL}/api/user/admin/signup-requests`, {
                withCredentials: true
            });
            if (response.data.success) {
                setSignupRequests(response.data.requests || []);
            }
        } catch (err) {
            console.error('회원가입 승인 요청 목록 조회 오류:', err);
            setSignupRequests([]);
        } finally {
            setLoadingSignupRequests(false);
        }
    };

    // 회원가입 승인
    const handleApproveSignup = async (userId) => {
        if (!window.confirm('회원가입을 승인하시겠습니까?')) {
            return;
        }

        setApprovingSignupId(userId);
        try {
            const response = await axios.put(
                `${config.API_BASE_URL}/api/user/admin/signup-requests/${userId}/approve`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                alert('승인되었습니다.');
                fetchSignupRequests();
                fetchMemberList();
            }
        } catch (err) {
            console.error('회원가입 승인 오류:', err);
            alert(err.response?.data?.error || '회원가입 승인 중 오류가 발생했습니다.');
        } finally {
            setApprovingSignupId(null);
        }
    };

    // 회원가입 거절(삭제)
    const handleRejectSignup = async (userId) => {
        if (!window.confirm('회원가입 요청을 거절(삭제)하시겠습니까?')) {
            return;
        }

        setRejectingSignupId(userId);
        try {
            const response = await axios.delete(
                `${config.API_BASE_URL}/api/user/admin/signup-requests/${userId}/reject`,
                { withCredentials: true }
            );

            if (response.data.success) {
                alert('거절(삭제)되었습니다.');
                fetchSignupRequests();
                fetchMemberList();
            }
        } catch (err) {
            console.error('회원가입 거절 오류:', err);
            alert(err.response?.data?.error || '회원가입 거절 중 오류가 발생했습니다.');
        } finally {
            setRejectingSignupId(null);
        }
    };

    // 닉네임 변경 요청 목록 조회
    const fetchNicknameRequests = async () => {
        setLoadingNicknameRequests(true);
        try {
            const response = await axios.get(`${config.API_BASE_URL}/api/user/admin/nickname-requests`, {
                withCredentials: true
            });
            if (response.data.success) {
                setNicknameRequests(response.data.requests || []);
            }
        } catch (err) {
            console.error('닉네임 변경 요청 목록 조회 오류:', err);
            setNicknameRequests([]);
        } finally {
            setLoadingNicknameRequests(false);
        }
    };

    // 닉네임 변경 요청 승인
    const handleApproveNickname = async (userId) => {
        if (!window.confirm('닉네임 변경을 승인하시겠습니까?')) {
            return;
        }

        setApprovingId(userId);
        try {
            const response = await axios.put(
                `${config.API_BASE_URL}/api/user/admin/nickname-requests/${userId}/approve`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                alert('닉네임 변경이 승인되었습니다.');
                fetchNicknameRequests(); // 목록 새로고침
            }
        } catch (err) {
            console.error('닉네임 변경 승인 오류:', err);
            alert(err.response?.data?.error || '닉네임 변경 승인 중 오류가 발생했습니다.');
        } finally {
            setApprovingId(null);
        }
    };

    // 닉네임 변경 요청 거절
    const handleRejectNickname = async (userId) => {
        if (!window.confirm('닉네임 변경 요청을 거절하시겠습니까?')) {
            return;
        }

        setRejectingId(userId);
        try {
            const response = await axios.put(
                `${config.API_BASE_URL}/api/user/admin/nickname-requests/${userId}/reject`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                alert('닉네임 변경 요청이 거절되었습니다.');
                fetchNicknameRequests(); // 목록 새로고침
            }
        } catch (err) {
            console.error('닉네임 변경 거절 오류:', err);
            alert(err.response?.data?.error || '닉네임 변경 거절 중 오류가 발생했습니다.');
        } finally {
            setRejectingId(null);
        }
    };

    // 종목 선택
    const handleSelectStock = (stock) => {
        setSelectedStock(stock);
        setStockSearchKeyword(stock.stockName);
        setStockSearchResults([]);
        // 종목 선택 시 계산된 매수 횟수 초기화
        setCalculatedTargetBuyCount(null);
    };

    // 인당 투자금액 변경 시 자동으로 매수 횟수 계산
    useEffect(() => {
        if (selectedStock && selectedStock.currentPrice && investPer && !isNaN(Number(investPer)) && Number(investPer) > 0) {
            const currentPrice = selectedStock.currentPrice;
            if (currentPrice > 0) {
                const calculated = Math.floor(Number(investPer) / currentPrice);
                setCalculatedTargetBuyCount(calculated);
            } else {
                setCalculatedTargetBuyCount(null);
            }
        } else {
            setCalculatedTargetBuyCount(null);
        }
    }, [selectedStock, investPer]);

    // 실매매 등록
    const handleRegisterRealTrade = async () => {
        if (!selectedStock) {
            alert('종목을 선택해주세요.');
            return;
        }
        if (!startDate) {
            alert('시작일을 입력해주세요.');
            return;
        }
        if (!investPer || isNaN(Number(investPer))) {
            alert('인당 투자금액을 올바르게 입력해주세요.');
            return;
        }
        if (!selectedStock.currentPrice || selectedStock.currentPrice <= 0) {
            alert('종목의 현재가 정보가 없습니다. 종목을 다시 선택해주세요.');
            return;
        }

        setRegistering(true);
        setRegisterResult(null);

        try {
            // 쿠키 방식 사용: localStorage에서 토큰을 읽지 않음
            const requestData = {
                stockName: selectedStock.stockName,
                stockCode: selectedStock.stockCode,
                startDate: startDate,
                investPer: Number(investPer),
                status: 'ACTIVE'
            };
            
            // 계산된 targetBuyCount 포함
            if (calculatedTargetBuyCount !== null && calculatedTargetBuyCount > 0) {
                requestData.targetBuyCount = calculatedTargetBuyCount;
            }
            
            const response = await axios.post(
                `${config.API_BASE_URL}/api/jugot/realtrade`,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true // 쿠키 자동 전송
                }
            );

            setRegisterResult(response.data);
            
            if (response.data.success) {
                alert('실매매 정보가 등록되었습니다.');
                // 폼 초기화
                setSelectedStock(null);
                setStockSearchKeyword('');
                setStartDate('');
                setInvestPer('');
                setCalculatedTargetBuyCount(null);
                // 실매매 리스트 새로고침
                fetchRealTradeList();
            }
        } catch (err) {
            console.error('실매매 등록 오류:', err);
            setRegisterResult({
                success: false,
                error: err.response?.data?.error || '실매매 등록 중 오류가 발생했습니다.'
            });
        } finally {
            setRegistering(false);
        }
    };

    // 실매매 삭제
    const handleDeleteRealTrade = async (id, stockName) => {
        // 확인 다이얼로그
        const confirmed = window.confirm(
            `정말로 "${stockName}" 실매매 정보를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
        );
        
        if (!confirmed) {
            return;
        }

        setDeletingId(id);
        try {
            // 쿠키 방식 사용: localStorage에서 토큰을 읽지 않음
            const response = await axios.delete(
                `${config.API_BASE_URL}/api/jugot/realtrade/${id}`,
                {
                    withCredentials: true // 쿠키 자동 전송
                }
            );

            if (response.data.success) {
                alert('실매매 정보가 삭제되었습니다.');
                // 실매매 리스트 새로고침
                fetchRealTradeList();
            }
        } catch (err) {
            console.error('실매매 삭제 오류:', err);
            alert(err.response?.data?.error || '실매매 삭제 중 오류가 발생했습니다.');
        } finally {
            setDeletingId(null);
        }
    };

    // 실매매 완료 처리
    const handleCompleteRealTrade = async (id, stockName) => {
        // 확인 다이얼로그
        const confirmed = window.confirm(
            `"${stockName}" 실매매를 완료 처리하시겠습니까?\n\n완료 처리된 항목은 활성 목록에서 제외됩니다.`
        );
        
        if (!confirmed) {
            return;
        }

        setCompletingId(id);
        try {
            // 쿠키 방식 사용: localStorage에서 토큰을 읽지 않음
            const response = await axios.put(
                `${config.API_BASE_URL}/api/jugot/realtrade/${id}/complete`,
                {},
                {
                    withCredentials: true // 쿠키 자동 전송
                }
            );

            if (response.data.success) {
                alert('실매매 정보가 완료 처리되었습니다.');
                // 실매매 리스트 새로고침
                fetchRealTradeList();
            }
        } catch (err) {
            console.error('실매매 완료 처리 오류:', err);
            alert(err.response?.data?.error || '실매매 완료 처리 중 오류가 발생했습니다.');
        } finally {
            setCompletingId(null);
        }
    };

    // 실매매 중단 처리
    const handlePauseRealTrade = async (id, stockName) => {
        // 확인 다이얼로그
        const confirmed = window.confirm(
            `"${stockName}" 실매매를 중단 처리하시겠습니까?\n\n중단 처리된 항목은 평단가 업데이트에서 제외됩니다.`
        );
        
        if (!confirmed) {
            return;
        }

        setPausingId(id);
        try {
            // 쿠키 방식 사용: localStorage에서 토큰을 읽지 않음
            const response = await axios.put(
                `${config.API_BASE_URL}/api/jugot/realtrade/${id}/pause`,
                {},
                {
                    withCredentials: true // 쿠키 자동 전송
                }
            );

            if (response.data.success) {
                alert('실매매 정보가 중단 처리되었습니다.');
                // 실매매 리스트 새로고침
                fetchRealTradeList();
            }
        } catch (err) {
            console.error('실매매 중단 처리 오류:', err);
            alert(err.response?.data?.error || '실매매 중단 처리 중 오류가 발생했습니다.');
        } finally {
            setPausingId(null);
        }
    };

    // 실매매 재개 처리
    const handleResumeRealTrade = async (id, stockName) => {
        // 확인 다이얼로그
        const confirmed = window.confirm(
            `"${stockName}" 실매매를 재개하시겠습니까?\n\n재개된 항목은 다시 평단가 업데이트에 포함됩니다.`
        );
        
        if (!confirmed) {
            return;
        }

        setResumingId(id);
        try {
            // 쿠키 방식 사용: localStorage에서 토큰을 읽지 않음
            const response = await axios.put(
                `${config.API_BASE_URL}/api/jugot/realtrade/${id}/resume`,
                {},
                {
                    withCredentials: true // 쿠키 자동 전송
                }
            );

            if (response.data.success) {
                alert('실매매 정보가 재개되었습니다.');
                // 실매매 리스트 새로고침
                fetchRealTradeList();
            }
        } catch (err) {
            console.error('실매매 재개 처리 오류:', err);
            alert(err.response?.data?.error || '실매매 재개 처리 중 오류가 발생했습니다.');
        } finally {
            setResumingId(null);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <h2>로딩 중...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="loading-container">
                <h2 style={{ color: '#ff6b6b' }}>{error}</h2>
                <p>잠시 후 메인 페이지로 이동합니다...</p>
            </div>
        );
    }

    return (
        <div className="content">
            <h1>관리자 페이지</h1>
            <div className="info-box" style={{ marginBottom: '20px' }}>
                <p>환영합니다, {userInfo?.nickname}님!</p>
                <p>사용자명: {userInfo?.username}</p>
                <p>권한: {userInfo?.role}</p>
            </div>

            {/* 멤버 리스트 */}
            <div className="stock-table-container" style={{ marginTop: '20px' }}>
                <h2>멤버 리스트 (총 {memberList.length}명)</h2>

                {loadingMemberList ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#fff' }}>
                        로딩 중...
                    </div>
                ) : memberList.length === 0 ? (
                    <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: 'rgba(255, 255, 255, 0.6)',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px'
                    }}>
                        등록된 멤버가 없습니다.
                    </div>
                ) : (
                    <div style={{
                        maxHeight: '400px',
                        overflowY: 'auto',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }}>
                        <table className="stock-table">
                            <thead>
                                <tr>
                                    <th>닉네임</th>
                                    <th>권한</th>
                                    <th>가입일시</th>
                                </tr>
                            </thead>
                            <tbody>
                                {memberList.map((member) => (
                                    <tr key={member.id}>
                                        <td>{member.nickname}</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                backgroundColor: member.role === 'pingddak'
                                                    ? 'rgba(255, 152, 0, 0.3)'
                                                    : 'rgba(158, 158, 158, 0.3)',
                                                color: '#fff',
                                                fontSize: '12px'
                                            }}>
                                                {member.role === 'pingddak' ? '관리자' : '사용자'}
                                            </span>
                                        </td>
                                        <td>{member.createdAt ? new Date(member.createdAt).toLocaleString('ko-KR') : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            <div className="stock-table-container">
                <h2>엑셀 업로드</h2>
                <p style={{ marginBottom: '15px', color: 'rgba(255, 255, 255, 0.8)' }}>
                    Jugot 데이터를 엑셀 파일(.xlsx, .xls) 또는 CSV 파일(.csv)로 업로드합니다.
                    <br />
                    필수 컬럼: stock_code (종목코드), stock_name (종목명), capture_price (포착가), capture_date (송곳일)
                    <br />
                    선택 컬럼: close_price (종가), market (시장구분)
                </p>
                
                <div style={{ marginBottom: '15px' }}>
                    <input
                        id="excel-file-input"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        style={{
                            padding: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            width: '100%',
                            maxWidth: '400px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: '#fff',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {selectedFile && (
                    <div style={{ 
                        marginBottom: '15px', 
                        padding: '10px', 
                        backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                        borderRadius: '8px',
                        color: '#fff'
                    }}>
                        선택된 파일: {selectedFile.name}
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="dashboard-link"
                    style={{
                        backgroundColor: uploading ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.15)',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        opacity: uploading ? 0.6 : 1
                    }}
                >
                    {uploading ? '업로드 중...' : '업로드'}
                </button>

                {uploadResult && (
                    <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        backgroundColor: uploadResult.success ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                        border: `1px solid ${uploadResult.success ? 'rgba(76, 175, 80, 0.4)' : 'rgba(244, 67, 54, 0.4)'}`,
                        borderRadius: '8px'
                    }}>
                        {uploadResult.success ? (
                            <div>
                                <h3 style={{ color: '#fff', marginTop: 0 }}>✓ 업로드 성공</h3>
                                <p style={{ color: '#fff', margin: '10px 0', fontSize: '16px', fontWeight: 'bold' }}>
                                    총 {uploadResult.totalRows || 0}건 중 {uploadResult.successCount || 0}건 성공
                                </p>
                                {uploadResult.message && (
                                    <p style={{ color: '#fff', margin: 0 }}>{uploadResult.message}</p>
                                )}
                            </div>
                        ) : (
                            <div>
                                <h3 style={{ color: '#fff', marginTop: 0 }}>✗ 업로드 결과</h3>
                                <p style={{ color: '#fff', margin: '10px 0', fontSize: '16px', fontWeight: 'bold' }}>
                                    총 {uploadResult.totalRows || 0}건 중 {uploadResult.successCount || 0}건 성공, {uploadResult.failCount || 0}건 실패
                                </p>
                                
                                {uploadResult.failedRows && uploadResult.failedRows.length > 0 && (
                                    <div style={{ marginTop: '15px' }}>
                                        <h4 style={{ color: '#fff', marginBottom: '10px' }}>실패한 항목:</h4>
                                        <div style={{
                                            maxHeight: '300px',
                                            overflowY: 'auto',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: '8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                        }}>
                                            <table className="stock-table">
                                                <thead>
                                                    <tr>
                                                        <th>행 번호</th>
                                                        <th>종목명</th>
                                                        <th>실패 이유</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {uploadResult.failedRows.map((failedRow, index) => (
                                                        <tr key={index}>
                                                            <td>{failedRow.row}</td>
                                                            <td>{failedRow.stockName || '(없음)'}</td>
                                                            <td>{failedRow.reason}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                                
                                {uploadResult.errors && uploadResult.errors.length > 0 && uploadResult.failedRows && uploadResult.failedRows.length === 0 && (
                                    <ul style={{ color: '#fff', margin: '10px 0', paddingLeft: '20px' }}>
                                        {uploadResult.errors.map((err, index) => (
                                            <li key={index}>{err}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="stock-table-container" style={{ marginTop: '20px' }}>
                <h2>실매매 등록</h2>

                {/* 종목 선택 */}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>
                        종목 검색
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            value={stockSearchKeyword}
                            onChange={(e) => setStockSearchKeyword(e.target.value)}
                            placeholder="종목명을 입력하세요"
                            style={{
                                padding: '10px',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                width: '100%',
                                maxWidth: '400px',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: '#fff'
                            }}
                        />
                        {stockSearchResults.length > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                maxWidth: '400px',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                marginTop: '5px',
                                zIndex: 1000
                            }}>
                                {stockSearchResults.map((stock, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleSelectStock(stock)}
                                        style={{
                                            padding: '10px',
                                            cursor: 'pointer',
                                            color: '#fff',
                                            borderBottom: index < stockSearchResults.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                        {stock.stockName} ({stock.stockCode})
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {selectedStock && (
                        <div style={{
                            marginTop: '10px',
                            padding: '10px',
                            backgroundColor: 'rgba(76, 175, 80, 0.2)',
                            borderRadius: '8px',
                            color: '#fff'
                        }}>
                            선택된 종목: {selectedStock.stockName} ({selectedStock.stockCode})
                            {selectedStock.currentPrice && (
                                <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
                                    현재가: {selectedStock.currentPrice.toLocaleString()}원
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 시작일 */}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>
                        시작일
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{
                            padding: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            width: '100%',
                            maxWidth: '400px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: '#fff'
                        }}
                    />
                </div>

                {/* 인당 투자금액 */}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>
                        인당 투자금액 (원)
                    </label>
                    <input
                        type="number"
                        value={investPer}
                        onChange={(e) => setInvestPer(e.target.value)}
                        placeholder="예: 1000000"
                        style={{
                            padding: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            width: '100%',
                            maxWidth: '400px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: '#fff'
                        }}
                    />
                </div>

                {/* 계산된 매수 횟수 표시 */}
                {calculatedTargetBuyCount !== null && (
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{
                            padding: '10px',
                            backgroundColor: 'rgba(76, 175, 80, 0.2)',
                            borderRadius: '8px',
                            color: '#fff',
                            border: '1px solid rgba(76, 175, 80, 0.4)'
                        }}>
                            <strong>계산된 매수 횟수:</strong> {calculatedTargetBuyCount}주
                            {selectedStock?.currentPrice && (
                                <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
                                    (인당 투자금액 {Number(investPer).toLocaleString()}원 ÷ 현재가 {selectedStock.currentPrice.toLocaleString()}원)
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 등록 버튼 */}
                <button
                    onClick={handleRegisterRealTrade}
                    disabled={!selectedStock || !startDate || !investPer || registering}
                    className="dashboard-link"
                    style={{
                        backgroundColor: registering ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.15)',
                        cursor: registering ? 'not-allowed' : 'pointer',
                        opacity: registering ? 0.6 : 1
                    }}
                >
                    {registering ? '등록 중...' : '등록'}
                </button>

                {/* 등록 결과 */}
                {registerResult && (
                    <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        backgroundColor: registerResult.success ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                        border: `1px solid ${registerResult.success ? 'rgba(76, 175, 80, 0.4)' : 'rgba(244, 67, 54, 0.4)'}`,
                        borderRadius: '8px'
                    }}>
                        {registerResult.success ? (
                            <div>
                                <h3 style={{ color: '#fff', marginTop: 0 }}>✓ 등록 성공</h3>
                                <p style={{ color: '#fff', margin: 0 }}>{registerResult.message}</p>
                            </div>
                        ) : (
                            <div>
                                <h3 style={{ color: '#fff', marginTop: 0 }}>✗ 등록 실패</h3>
                                <p style={{ color: '#fff', margin: 0 }}>{registerResult.error}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 실매매 리스트 관리 */}
            <div className="stock-table-container" style={{ marginTop: '20px' }}>
                <h2>실매매 리스트 관리</h2>

                {loadingRealTradeList ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#fff' }}>
                        로딩 중...
                    </div>
                ) : realTradeList.length === 0 ? (
                    <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: 'rgba(255, 255, 255, 0.6)',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px'
                    }}>
                        등록된 실매매 정보가 없습니다.
                    </div>
                ) : (
                    <div style={{
                        maxHeight: '500px',
                        overflowY: 'auto',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }}>
                        <table className="stock-table">
                            <thead>
                                <tr>
                                    <th>종목명</th>
                                    <th>종목코드</th>
                                    <th>시작일</th>
                                    <th>인당 투자금액</th>
                                    <th>목표 매수 횟수</th>
                                    <th>참여자</th>
                                    <th>상태</th>
                                    <th>등록일시</th>
                                    <th>관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {realTradeList.map((trade) => (
                                    <tr key={trade.id}>
                                        <td>{trade.stockName}</td>
                                        <td>{trade.stockCode}</td>
                                        <td>{trade.startDate}</td>
                                        <td>{trade.investPer?.toLocaleString() || 0}원</td>
                                        <td>{trade.targetBuyCount || '-'}</td>
                                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {trade.joinMember || '-'}
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                backgroundColor: trade.status === 'ACTIVE' 
                                                    ? 'rgba(76, 175, 80, 0.3)' 
                                                    : trade.status === 'PAUSED'
                                                    ? 'rgba(255, 152, 0, 0.3)'
                                                    : 'rgba(158, 158, 158, 0.3)',
                                                color: '#fff',
                                                fontSize: '12px',
                                                border: `1px solid ${trade.status === 'ACTIVE' 
                                                    ? 'rgba(76, 175, 80, 0.5)' 
                                                    : trade.status === 'PAUSED'
                                                    ? 'rgba(255, 152, 0, 0.5)'
                                                    : 'rgba(158, 158, 158, 0.5)'}`
                                            }}>
                                                {trade.status === 'ACTIVE' ? '진행중' : trade.status === 'PAUSED' ? '중단' : trade.status}
                                            </span>
                                        </td>
                                        <td>{trade.createdAt ? new Date(trade.createdAt).toLocaleString('ko-KR') : '-'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleCompleteRealTrade(trade.id, trade.stockName)}
                                                    disabled={completingId === trade.id || deletingId === trade.id || pausingId === trade.id || resumingId === trade.id}
                                                    style={{
                                                        padding: '5px 10px',
                                                        backgroundColor: 'rgba(76, 175, 80, 0.3)',
                                                        border: '1px solid rgba(76, 175, 80, 0.5)',
                                                        borderRadius: '4px',
                                                        color: '#fff',
                                                        cursor: (completingId === trade.id || deletingId === trade.id || pausingId === trade.id || resumingId === trade.id) ? 'not-allowed' : 'pointer',
                                                        opacity: (completingId === trade.id || deletingId === trade.id || pausingId === trade.id || resumingId === trade.id) ? 0.6 : 1,
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    {completingId === trade.id ? '완료 중...' : '완료'}
                                                </button>
                                                {trade.status === 'ACTIVE' ? (
                                                    <button
                                                        onClick={() => handlePauseRealTrade(trade.id, trade.stockName)}
                                                        disabled={pausingId === trade.id || deletingId === trade.id || completingId === trade.id || resumingId === trade.id}
                                                        style={{
                                                            padding: '5px 10px',
                                                            backgroundColor: 'rgba(255, 152, 0, 0.3)',
                                                            border: '1px solid rgba(255, 152, 0, 0.5)',
                                                            borderRadius: '4px',
                                                            color: '#fff',
                                                            cursor: (pausingId === trade.id || deletingId === trade.id || completingId === trade.id || resumingId === trade.id) ? 'not-allowed' : 'pointer',
                                                            opacity: (pausingId === trade.id || deletingId === trade.id || completingId === trade.id || resumingId === trade.id) ? 0.6 : 1,
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        {pausingId === trade.id ? '중단 중...' : '중단'}
                                                    </button>
                                                ) : trade.status === 'PAUSED' ? (
                                                    <button
                                                        onClick={() => handleResumeRealTrade(trade.id, trade.stockName)}
                                                        disabled={resumingId === trade.id || deletingId === trade.id || completingId === trade.id || pausingId === trade.id}
                                                        style={{
                                                            padding: '5px 10px',
                                                            backgroundColor: 'rgba(33, 150, 243, 0.3)',
                                                            border: '1px solid rgba(33, 150, 243, 0.5)',
                                                            borderRadius: '4px',
                                                            color: '#fff',
                                                            cursor: (resumingId === trade.id || deletingId === trade.id || completingId === trade.id || pausingId === trade.id) ? 'not-allowed' : 'pointer',
                                                            opacity: (resumingId === trade.id || deletingId === trade.id || completingId === trade.id || pausingId === trade.id) ? 0.6 : 1,
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        {resumingId === trade.id ? '재개 중...' : '재개'}
                                                    </button>
                                                ) : null}
                                                <button
                                                    onClick={() => handleDeleteRealTrade(trade.id, trade.stockName)}
                                                    disabled={deletingId === trade.id || completingId === trade.id || pausingId === trade.id || resumingId === trade.id}
                                                    style={{
                                                        padding: '5px 10px',
                                                        backgroundColor: 'rgba(244, 67, 54, 0.3)',
                                                        border: '1px solid rgba(244, 67, 54, 0.5)',
                                                        borderRadius: '4px',
                                                        color: '#fff',
                                                        cursor: (deletingId === trade.id || completingId === trade.id || pausingId === trade.id || resumingId === trade.id) ? 'not-allowed' : 'pointer',
                                                        opacity: (deletingId === trade.id || completingId === trade.id || pausingId === trade.id || resumingId === trade.id) ? 0.6 : 1,
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    {deletingId === trade.id ? '삭제 중...' : '삭제'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 회원가입 승인 요청 목록 */}
            <div className="stock-table-container" style={{ marginTop: '20px' }}>
                <h2>회원가입 승인 요청 목록</h2>

                {loadingSignupRequests ? (
                    <p style={{ color: '#fff', textAlign: 'center' }}>로딩 중...</p>
                ) : signupRequests.length === 0 ? (
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', padding: '20px' }}>
                        현재 회원가입 승인 대기 중인 요청이 없습니다.
                    </p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="stock-table">
                            <thead>
                                <tr>
                                    <th>아이디</th>
                                    <th>닉네임</th>
                                    <th>가입요청일시</th>
                                    <th>작업</th>
                                </tr>
                            </thead>
                            <tbody>
                                {signupRequests.map((request) => (
                                    <tr key={request.id}>
                                        <td>{request.username}</td>
                                        <td>{request.nickname}</td>
                                        <td>{request.createdAt ? new Date(request.createdAt).toLocaleString('ko-KR') : '-'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleApproveSignup(request.id)}
                                                    disabled={approvingSignupId === request.id || rejectingSignupId === request.id}
                                                    style={{
                                                        padding: '5px 10px',
                                                        backgroundColor: 'rgba(76, 175, 80, 0.3)',
                                                        border: '1px solid rgba(76, 175, 80, 0.5)',
                                                        borderRadius: '4px',
                                                        color: '#fff',
                                                        cursor: (approvingSignupId === request.id || rejectingSignupId === request.id) ? 'not-allowed' : 'pointer',
                                                        opacity: (approvingSignupId === request.id || rejectingSignupId === request.id) ? 0.6 : 1,
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    {approvingSignupId === request.id ? '승인 중...' : '승인'}
                                                </button>
                                                <button
                                                    onClick={() => handleRejectSignup(request.id)}
                                                    disabled={rejectingSignupId === request.id || approvingSignupId === request.id}
                                                    style={{
                                                        padding: '5px 10px',
                                                        backgroundColor: 'rgba(244, 67, 54, 0.3)',
                                                        border: '1px solid rgba(244, 67, 54, 0.5)',
                                                        borderRadius: '4px',
                                                        color: '#fff',
                                                        cursor: (rejectingSignupId === request.id || approvingSignupId === request.id) ? 'not-allowed' : 'pointer',
                                                        opacity: (rejectingSignupId === request.id || approvingSignupId === request.id) ? 0.6 : 1,
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    {rejectingSignupId === request.id ? '거절 중...' : '거절'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 닉네임 변경 요청 목록 */}
            <div className="stock-table-container" style={{ marginTop: '20px' }}>
                <h2>닉네임 변경 요청 목록</h2>

                {loadingNicknameRequests ? (
                    <p style={{ color: '#fff', textAlign: 'center' }}>로딩 중...</p>
                ) : nicknameRequests.length === 0 ? (
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', padding: '20px' }}>
                        현재 닉네임 변경 요청이 없습니다.
                    </p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="stock-table">
                            <thead>
                                <tr>
                                    <th>사용자 ID</th>
                                    <th>사용자명</th>
                                    <th>현재 닉네임</th>
                                    <th>변경 요청 닉네임</th>
                                    <th>작업</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nicknameRequests.map((request) => (
                                    <tr key={request.id}>
                                        <td>{request.id}</td>
                                        <td>{request.username}</td>
                                        <td>{request.currentNickname}</td>
                                        <td>
                                            <strong style={{ color: '#f39060' }}>
                                                {request.requestedNickname}
                                            </strong>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleApproveNickname(request.id)}
                                                    disabled={approvingId === request.id || rejectingId === request.id}
                                                    style={{
                                                        padding: '5px 10px',
                                                        backgroundColor: 'rgba(76, 175, 80, 0.3)',
                                                        border: '1px solid rgba(76, 175, 80, 0.5)',
                                                        borderRadius: '4px',
                                                        color: '#fff',
                                                        cursor: (approvingId === request.id || rejectingId === request.id) ? 'not-allowed' : 'pointer',
                                                        opacity: (approvingId === request.id || rejectingId === request.id) ? 0.6 : 1,
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    {approvingId === request.id ? '승인 중...' : '승인'}
                                                </button>
                                                <button
                                                    onClick={() => handleRejectNickname(request.id)}
                                                    disabled={rejectingId === request.id || approvingId === request.id}
                                                    style={{
                                                        padding: '5px 10px',
                                                        backgroundColor: 'rgba(244, 67, 54, 0.3)',
                                                        border: '1px solid rgba(244, 67, 54, 0.5)',
                                                        borderRadius: '4px',
                                                        color: '#fff',
                                                        cursor: (rejectingId === request.id || approvingId === request.id) ? 'not-allowed' : 'pointer',
                                                        opacity: (rejectingId === request.id || approvingId === request.id) ? 0.6 : 1,
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    {rejectingId === request.id ? '거절 중...' : '거절'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '20px' }}>
                <button 
                    onClick={() => navigate('/')}
                    className="dashboard-link"
                >
                    메인 페이지로 돌아가기
                </button>
            </div>
        </div>
    );
};

export default AdminPage;

