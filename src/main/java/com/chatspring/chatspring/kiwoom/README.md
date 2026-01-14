# 키움 API 주식 데이터 자동 업데이트 시스템

이 시스템은 키움 API를 사용하여 매일 평일 15:30에 올해 종목들의 주식 데이터를 자동으로 조회하고 DB에 업데이트합니다.

## 주요 기능

1. **자동 스케줄링**: 매일 평일 15:30에 자동 실행
2. **키움 API 연동**: 실시간 주식 데이터 조회
3. **30일치 데이터 분석**: 최고가, 최저가 계산
4. **DB 자동 업데이트**: currentPrice, highestPrice, lowestPrice 업데이트

## 설정

### application.properties 설정

```properties
# 키움 API 설정
kiwoom.api.appkey=your_appkey_here
kiwoom.api.secretkey=your_secretkey_here
kiwoom.api.host=https://api.kiwoom.com
kiwoom.api.timeout=10
kiwoom.api.retry=2
```

### 환경변수 설정 (선택사항)

환경변수로도 설정 가능합니다:
- `KIWOOM_API_APPKEY`
- `KIWOOM_API_SECRETKEY`
- `KIWOOM_API_HOST`

## API 엔드포인트

### 1. 특정 종목 데이터 수동 업데이트
```
POST /api/kiwoom/update/{stockCode}
```

예시:
```bash
curl -X POST http://localhost:8080/api/kiwoom/update/005930
```

### 2. 모든 올해 종목 데이터 수동 업데이트
```
POST /api/kiwoom/update-all
```

예시:
```bash
curl -X POST http://localhost:8080/api/kiwoom/update-all
```

## 동작 방식

1. **토큰 발급**: 키움 API에서 접근 토큰을 발급받습니다.
2. **종목 조회**: DB에서 올해 캡처된 종목들을 조회합니다.
3. **데이터 수집**: 각 종목별로 30일치 일별 주가 데이터를 조회합니다.
4. **데이터 분석**: 
   - 당일 종가 → currentPrice
   - 30일간 최고가 → highestPrice (기존 값과 비교하여 더 높은 값으로 업데이트)
   - 30일간 최저가 → lowestPrice (기존 값과 비교하여 더 낮은 값으로 업데이트)
5. **DB 업데이트**: 분석된 데이터를 Jugot 테이블에 저장합니다.

## 스케줄 설정

현재 설정: `@Scheduled(cron = "0 30 15 * * MON-FRI", zone = "Asia/Seoul")`
- 매일 평일 15:30 (한국 시간)
- 월요일~금요일만 실행

## 로그

시스템은 상세한 로그를 제공합니다:
- 토큰 발급 상태
- 각 종목별 데이터 조회 상태
- 업데이트 결과
- 오류 발생 시 상세 정보

## 주의사항

1. **API 호출 제한**: 키움 API 호출 간격을 120ms로 설정하여 제한을 준수합니다.
2. **오류 처리**: 개별 종목 업데이트 실패 시에도 다른 종목 처리를 계속합니다.
3. **토큰 관리**: 매번 새로운 토큰을 발급받아 사용합니다.
4. **데이터 검증**: API 응답 데이터의 유효성을 검증합니다.

## 테스트

개발/테스트 환경에서는 수동 업데이트 API를 사용하여 테스트할 수 있습니다:

```bash
# 특정 종목 테스트
curl -X POST http://localhost:8080/api/kiwoom/update/005930

# 모든 종목 테스트
curl -X POST http://localhost:8080/api/kiwoom/update-all
```
