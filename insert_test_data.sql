-- 테스트용 종목 데이터 추가

-- 삼성전자 테스트 데이터
INSERT INTO jugots (stock_name, stock_code, capture_price, capture_date, market_type, current_price, highest_price, lowest_price)
VALUES ('삼성전자', '005930', 70000, '2024-10-24', 'KOSPI', 70000, 70000, 70000);

-- SK하이닉스 테스트 데이터
INSERT INTO jugots (stock_name, stock_code, capture_price, capture_date, market_type, current_price, highest_price, lowest_price)
VALUES ('SK하이닉스', '000660', 120000, '2024-10-24', 'KOSPI', 120000, 120000, 120000);

-- LG에너지솔루션 테스트 데이터
INSERT INTO jugots (stock_name, stock_code, capture_price, capture_date, market_type, current_price, highest_price, lowest_price)
VALUES ('LG에너지솔루션', '373220', 400000, '2024-10-24', 'KOSPI', 400000, 400000, 400000);
