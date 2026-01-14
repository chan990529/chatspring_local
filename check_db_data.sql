-- DB 데이터 확인용 SQL 쿼리들

-- 1. 올해 종목들 조회
SELECT 
    trade_id,
    stock_name,
    stock_code,
    current_price,
    highest_price,
    lowest_price,
    capture_date
FROM jugots 
WHERE YEAR(capture_date) = 2024
ORDER BY capture_date DESC
LIMIT 10;

-- 2. 전체 종목 수 확인
SELECT COUNT(*) as total_count FROM jugots;

-- 3. 올해 종목 수 확인
SELECT COUNT(*) as current_year_count 
FROM jugots 
WHERE YEAR(capture_date) = 2024;

-- 4. 특정 종목 확인 (삼성전자)
SELECT * FROM jugots WHERE stock_code = '005930';
