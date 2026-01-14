import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { Card } from '@mui/material';
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import config from '../../config';

// axios.defaults.baseURL = 'https://scalping.app';
axios.defaults.baseURL = config.API_BASE_URL;

const TradeStatistics = () => {
  const [statistics, setStatistics] = useState({
    date: 'N/A',
    count_sell_price_1: 0,
    count_sell_price_2: 0,
    count_sell_price_3: 0,
    total_trades: 0,
    total_wins: 0,
    avg_reach_time: 'N/A',

    win_ratio_kospi: 0,
    win_ratio_kosdaq: 0,
    ratio_max_buy: 0,
    win_ratio_morning: 0,
    win_ratio_volume: 0,
    count_stop_loss: 0
  });
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  // 최근 10일치 승률 데이터를 저장할 state
  const [historyData, setHistoryData] = useState([]);

  // 단일 날짜의 통계 데이터를 불러오는 함수
  const fetchStatistics = async (date) => {
    setIsLoading(true);
    try {
      const url = date ? `/api/trades/statistics?date=${date}` : '/api/trades/statistics';
      const response = await axios.get(url);
      setStatistics(response.data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch trade statistics:', error);
      setError('통계 데이터를 가져오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 최근 10일치 데이터를 불러오는 함수
  const fetchHistoryData = async () => {
    try {
      // selectedDate가 있을 경우 ?days=10&date=YYYY-MM-DD 형식으로 API 호출
      const query = selectedDate ? `?days=10&date=${selectedDate}` : `?days=10`;
      const response = await axios.get(`/api/trades/statistics/history${query}`);
      const formattedData = response.data.map(item => ({
        date: item.date,
        winRatio: item.win_ratio  // 백엔드에서 win_ratio로 반환한 값을 winRatio로 변환
      }));
      setHistoryData(formattedData);
    } catch (error) {
      console.error('Failed to fetch history data:', error);
    }
  };

  useEffect(() => {
    fetchStatistics();
    fetchHistoryData();
  }, []);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setShowDatePicker(false);
  };

  const handleManualDateInput = () => {
    if (year && month && day) {
      const formattedMonth = month.padStart(2, '0');
      const formattedDay = day.padStart(2, '0');
      const formattedDate = `${year}-${formattedMonth}-${formattedDay}`;
      setSelectedDate(formattedDate);
    }
  };

  useEffect(() => {
    handleManualDateInput();
  }, [year, month, day]);

  const handleSearch = () => {
    if (selectedDate) {
      fetchStatistics(selectedDate);
      fetchHistoryData();  // 검색한 날짜를 기준으로 history 데이터 갱신
    }
  };

  const calculatePercentage = (count) => {
    return statistics.total_trades > 0 ? ((count / statistics.total_trades) * 100).toFixed(2) + '%' : '0%';
  };

  return (
      <Card className="p-4">
        <div className="space-y-4">
          <h2 className="text-xl font-bold">거래 통계 검색</h2>

          <div className="space-y-4">
            <div className="relative">
              <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              />
            </div>

            <button
                onClick={handleSearch}
                disabled={!selectedDate || isLoading}
                className={`w-full px-4 py-2 rounded-lg text-white ${
                    !selectedDate || isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
                }`}
            >
              {isLoading ? '검색 중...' : '검색'}
            </button>
          </div>

          {error ? (
              <div className="text-red-500 font-bold">{error}</div>
          ) : (
              <div className="space-y-2 mt-4">
                <p>
                  <span className="font-bold">날짜:</span> {statistics.date}
                </p>
                <p>
                  <span className="font-bold">포착종목수:</span> {statistics.total_trades}
                </p>
                <p>
                  <span className="font-bold">승리 :</span> {statistics.total_wins}
                  <span className="font-bold"> 패배 :</span>{' '}
                  {statistics.total_trades - statistics.total_wins}
                </p>
                <p>
                  <span className="font-bold">승률 :</span>{' '}
                  {calculatePercentage(statistics.total_wins)}
                </p>
                <p>
                  <span className="font-bold">평균 도달시간 :</span>{' '}
                  {statistics.avg_reach_time}
                </p>
                <p>
                  <span className="font-bold">코스피 승률 :</span>{' '}
                  {statistics.win_ratio_kospi}%
                </p>
                <p>
                  <span className="font-bold">코스닥 승률 :</span>{' '}
                  {statistics.win_ratio_kosdaq}%
                </p>
                <p>
                  <span className="font-bold">풀빠다 승률 :</span>{' '}
                  {statistics.ratio_max_buy}%
                </p>
                <p>
                  <span className="font-bold">복어 승률 :</span>{' '}
                  {statistics.win_ratio_morning}%
                </p>
                <p>
                  <span className="font-bold">전일비(30) 승률 :</span>{' '}
                  {statistics.win_ratio_volume}%
                </p>
                <p>
                  <span className="font-bold">손절(-3.5) 개수 :</span>{' '}
                  {statistics.count_stop_loss}
                </p>
              </div>
          )}

          {/* 최근 10일 승률 꺾은선 그래프 */}
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-4">최근 10일 승률</h3>
            {historyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                      data={historyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="winRatio"
                        name="승률"
                        stroke="#0A82FF"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
            ) : (
                <p>최근 10일 승률 데이터를 불러오는 중...</p>
            )}
          </div>
        </div>
      </Card>
  );
};

export default TradeStatistics;
