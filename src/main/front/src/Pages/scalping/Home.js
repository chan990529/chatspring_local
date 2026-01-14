import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './Home.css';  // CSS 파일을 따로 관리
import config from '../../config';

function StockManagement() {
    const [stocks, setStocks] = useState([]);
    const [newStock, setNewStock] = useState({
        stockName: '',
        captureDate: '',
        capturePrice: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [selectedStocks, setSelectedStocks] = useState([]); // 선택된 주식 관리
    const [inputText, setInputText] = useState(''); // 텍스트 입력 상태 추가
    const [isAllSelected, setIsAllSelected] = useState(false); // 모든 선택 관리
    const [excludedCount, setExcludedCount] = useState(0); // 제외된 항목 수
    const [isExcludedModalOpen, setIsExcludedModalOpen] = useState(false); // 제외 모달 상태 관리


    // API를 통해 모든 주식 목록 가져오기
    useEffect(() => {
        fetchAllStocks();
    }, []);

    const fetchAllStocks = () => {
        axios.get(`${config.API_BASE_URL}/api/stocks`)
            .then(response => {
                setStocks(response.data);
                setIsAllSelected(false); // 초기화
                setSelectedStocks([]); // 초기화
            })
            .catch(error => console.error(error));
    };

    // 이름으로 검색
    const searchStocks = () => {
        axios.get(`${config.API_BASE_URL}/api/stocks/search?name=${searchTerm}`)
            .then(response => setStocks(response.data))
            .catch(error => console.error(error));
    };

    // 날짜로 필터링
    const filterByDate = () => {
        const start = startDate ? startDate.toISOString().split('T')[0] : '';
        const end = endDate ? endDate.toISOString().split('T')[0] : '';
        axios.get(`${config.API_BASE_URL}/api/stocks/filter?startDate=${start}&endDate=${end}`)
            .then(response => setStocks(response.data))
            .catch(error => console.error(error));
    };

    // 입력 값 변경 핸들러
    const handleInputChange = (e) => {
        setNewStock({
            ...newStock,
            [e.target.name]: e.target.value
        });
    };

    // 새 주식 추가 핸들러
    const handleSubmit = (e) => {
        e.preventDefault();
    
        // captureDate가 문자열일 경우 Date 객체로 변환
        let captureDate = newStock.captureDate;
        if (typeof captureDate === 'string') {
            captureDate = new Date(captureDate);
        }
    
        if (!(captureDate instanceof Date) || isNaN(captureDate)) {
            console.error("Invalid captureDate");
            return; // 유효하지 않은 날짜일 경우 처리하지 않음
        }
    
        const formattedStock = {
            ...newStock,
            capturePrice: parseFloat(newStock.capturePrice),
            captureDate: captureDate.getFullYear() + '-' +
                         String(captureDate.getMonth() + 1).padStart(2, '0') + '-' +
                         String(captureDate.getDate()).padStart(2, '0')
        };
    
        if (isDuplicateStock(formattedStock.stockName, formattedStock.capturePrice, formattedStock.captureDate)) {
            setExcludedCount(1); // 중복된 항목 1개 제외
            setIsExcludedModalOpen(true); // 중복된 항목 제외 알림 모달 열기
        } else {
            axios.post(`${config.API_BASE_URL}/api/stocks`, formattedStock)
                .then(response => setStocks([...stocks, response.data]))
                .catch(error => console.error(error));
        }
    };

    
    const deleteSelectedStocks = () => {
        axios.post(`${config.API_BASE_URL}/api/stocks/delete`, { ids: selectedStocks })
            .then(() => {
                setStocks(stocks.filter(stock => !selectedStocks.includes(stock.id)));
                setSelectedStocks([]); // 선택 항목 초기화
                setIsAllSelected(false); // 모두 선택 해제
            })
            .catch(error => console.error(error));
    };

    // 텍스트 입력 핸들러 (파싱용)
    const handleTextInput = (e) => {
        setInputText(e.target.value);
    };

    // 정렬 함수 추가
    const handleSort = (columnKey) => {
      let direction = 'asc';
      if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key: columnKey, direction: direction });

      const sortedStocks = [...stocks].sort((a, b) => {
          if (a[columnKey] < b[columnKey]) return direction === 'asc' ? -1 : 1;
          if (a[columnKey] > b[columnKey]) return direction === 'asc' ? 1 : -1;
          return 0;
      });
      setStocks(sortedStocks);
    };

    // 체크박스 선택 핸들러 추가
    const handleSelectStock = (id) => {
      let updatedSelectedStocks = [];
      if (selectedStocks.includes(id)) {
          updatedSelectedStocks = selectedStocks.filter(stockId => stockId !== id);
      } else {
          updatedSelectedStocks = [...selectedStocks, id];
      }
      setSelectedStocks(updatedSelectedStocks);
      setIsAllSelected(updatedSelectedStocks.length === stocks.length); // 모든 항목 선택 상태 동기화
    };

    // 모든 항목 선택/해제 핸들러
    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedStocks([]); // 모든 선택 해제
        } else {
            setSelectedStocks(stocks.map(stock => stock.id)); // 모든 항목 선택
        }
        setIsAllSelected(!isAllSelected); // 선택 상태 반전
    };
    //const [duplicateStocks, setDuplicateStocks] = useState([]); // 중복된 주식 관리
    const isDuplicateStock = (stockName, capturePrice, captureDate) => {
      return stocks.some(stock => 
          stock.stockName === stockName && 
          stock.capturePrice === capturePrice && 
          stock.captureDate === captureDate
      );
  };

    const [bulkCaptureDate, setBulkCaptureDate] = useState(new Date());

    // 텍스트를 파싱하여 종목을 추가하는 핸들러
    const handleTextSubmit = (e) => {
        e.preventDefault();
    
        const formattedDate = bulkCaptureDate.getFullYear() + '-' +
            String(bulkCaptureDate.getMonth() + 1).padStart(2, '0') + '-' +
            String(bulkCaptureDate.getDate()).padStart(2, '0');
    
            const parsedStocks = inputText.split('\n').map(line => {
                const [stockName, price] = line.split(':').map(part => part.trim());
                
                // price가 존재하는지 확인한 후 replace를 호출합니다.
                const validPrice = price ? parseFloat(price.replace(/,/g, '')) : null;
            
                return {
                    stockName: stockName,
                    capturePrice: validPrice,
                    captureDate: formattedDate
                };
            });
    
        const nonDuplicateStocks = parsedStocks.filter(stock =>
            !isDuplicateStock(stock.stockName, stock.capturePrice, stock.captureDate)
        );
    
        const duplicates = parsedStocks.filter(stock =>
            isDuplicateStock(stock.stockName, stock.capturePrice, stock.captureDate)
        );
    
        // 중복된 항목이 있을 경우, 중복 수를 알리는 모달을 염
        if (duplicates.length > 0) {
            setExcludedCount(duplicates.length); // 중복된 항목 수 설정
            setIsExcludedModalOpen(true); // 중복된 항목 제외 알림 모달 열기
        }
    
        // 중복되지 않은 항목이 있을 경우에만 서버에 등록
        if (nonDuplicateStocks.length > 0) {
            axios.post(`${config.API_BASE_URL}/api/stocks/batch`, nonDuplicateStocks)
                .then(response => {
                    setStocks([...stocks, ...response.data]);
                    setInputText(''); // 텍스트 입력 초기화
                })
                .catch(error => console.error(error));
        }
    };
    


    const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태 관리

    const openModal = () => {
        setIsModalOpen(true);
    };


    const closeModal = () => {
      setIsModalOpen(false);
      setInputText(''); // 모달 닫을 때 입력 필드 초기화
  };

  const closeExcludedModal = () => {
    setIsExcludedModalOpen(false);
    };


    return (
        <div className="stock-management-container">
            <h1>주식 관리</h1>

            {/* 이름으로 검색 */}
            <div className="filter-section">
                <input
                    type="text"
                    placeholder="주식 이름으로 검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button onClick={searchStocks}>검색</button>
            </div>

            {/* 날짜 필터링 */}
            <div className="filter-section">
                <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="시작 날짜"
                />
                <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="종료 날짜"
                />
                <button onClick={filterByDate}>날짜로 필터링</button>
            </div>

            {/* 주식 추가 폼 */}
            <form onSubmit={handleSubmit} className="stock-form">
                <input
                    name="stockName"
                    value={newStock.stockName}
                    onChange={handleInputChange}
                    placeholder="주식 이름"
                />
                <DatePicker
                    selected={newStock.captureDate}
                    onChange={(date) => setNewStock({ ...newStock, captureDate: date })}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="포착 날짜"
                />
                <input
                    name="capturePrice"
                    value={newStock.capturePrice}
                    onChange={handleInputChange}
                    placeholder="포착 가격"
                    type="number"
                    step="0.01"
                />
                <button type="submit">주식 추가</button>
            </form>

            {/* 팝업 열기 버튼 */}
            <button onClick={openModal}>포착 종목 일괄 등록</button>

            {/* 모달 창 */}
            {isModalOpen && (
              <div className="modal">
                <div className="modal-content">
                  <span className="close" onClick={closeModal}>&times;</span>
                  <h2>포착 종목 일괄 등록</h2>
                  <form className="text-input-form">
                    <DatePicker
                      selected={bulkCaptureDate}
                      onChange={(date) => setBulkCaptureDate(date)}
                      dateFormat="yyyy-MM-dd"
                      placeholderText="포착 날짜 선택"
                    />
                    <textarea
                      value={inputText}
                      onChange={handleTextInput}
                      placeholder="포착 종목과 가격을 입력하세요. 예: 삼성전자 : 50000"
                      rows={10}
                      cols={50}
                    />
                    <button type="button" onClick={handleTextSubmit}>포착 종목 입력</button>
                  </form>
                </div>
              </div>
            )}
            
            {isExcludedModalOpen && (
    <div className="modal">
        <div className="modal-content">
            <span className="close" onClick={closeExcludedModal}>&times;</span>
            <h2>중복된 항목 제외</h2>
            <p>{excludedCount}개의 항목이 중복되어 제외되었습니다.</p>
            <button onClick={closeExcludedModal}>확인</button>
        </div>
    </div>
)}
            {/* 선택된 항목 삭제 버튼 */}
            <button onClick={deleteSelectedStocks} disabled={selectedStocks.length === 0}>
                선택된 항목 삭제
            </button>

            {/* 주식 목록 */}
            <table className="stock-table">
                <thead>
                    <tr>
                        <th>
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={handleSelectAll} // 모두 선택 체크박스
                            />
                        </th>
                        <th onClick={() => handleSort('stockName')}>
                            주식 이름 {sortConfig.key === 'stockName' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                        </th>
                        <th onClick={() => handleSort('captureDate')}>
                            포착 날짜 {sortConfig.key === 'captureDate' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                        </th>
                        <th onClick={() => handleSort('capturePrice')}>
                            포착 가격 {sortConfig.key === 'capturePrice' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                  {stocks.map(stock => (
                    <tr key={stock.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedStocks.includes(stock.id)}
                          onChange={() => handleSelectStock(stock.id)}
                        />
                      </td>
                      <td>{stock.stockName}</td>
                      <td>{stock.captureDate}</td>
                      <td>{stock.capturePrice}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
        </div>
    );
}

export default StockManagement;
