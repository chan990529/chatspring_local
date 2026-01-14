package com.chatspring.chatspring.kiwoom;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;

import org.springframework.web.client.RestClientException;
import com.fasterxml.jackson.core.JsonProcessingException;


@Service
public class KiwoomApiClient {

    private static final Logger log = LoggerFactory.getLogger(KiwoomApiClient.class);
    
    // 토큰 캐시
    private String cachedToken;
    private String tokenExpiresDt;
    private long tokenCacheTime;
    

    private static String debugCodepoints(String s) {
        if (s == null) return "null";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            sb.append(String.format("[%d U+%04X '%s']",
                    i, (int) s.charAt(i), s.substring(i, i + 1)));
        }
        return sb.toString();
    }

    /** 유니코드 공백/부호까지 제거 + 최종 fallback: 숫자만 추출 */
    private static Integer parsePriceOrNull(String raw, String code, String date, String fieldName, Logger log) {
        if (raw == null) {
            log.warn("{} null: code={}, date={}", fieldName, code, date);
            return null;
        }
        // 1) 전처리: 모든 공백(ASCII/유니코드) 제거
        // \p{Zs} = Unicode space separators, \s = ASCII whitespace
        String s = raw.replaceAll("[\\p{Zs}\\s]", "");

        // 2) 흔한 유니코드 부호/전각부호 제거 (＋ － − 등)
        s = s.replaceAll("[+\\-\\u2212\\uFF0B\\uFF0D]", "");

        // 3) 천단위 구분자(전각/반각) 제거
        s = s.replaceAll("[,\\uFF0C]", "");

        // 4) 그대로 파싱 시도
        try {
            if (s.isEmpty()) throw new NumberFormatException("empty after sanitize");
            return Integer.parseInt(s);
        } catch (NumberFormatException e1) {
            // 5) 최후의 보루: 숫자만 추출해서 파싱
            String digitsOnly = s.replaceAll("\\D", "");
            try {
                if (digitsOnly.isEmpty()) throw new NumberFormatException("no digits");
                return Integer.parseInt(digitsOnly);
            } catch (NumberFormatException e2) {
                // 원인 분석을 위해 코드포인트 로그 남김
                log.warn("{} 파싱 실패: code={}, date={}, raw='{}', raw-cp={}, sani='{}', sani-cp={}",
                        fieldName, code, date, raw, debugCodepoints(raw), s, debugCodepoints(s));
                return null;
            }
        }
    }

    private static Integer parsePriceNonNegative(com.fasterxml.jackson.databind.JsonNode row, String key) {
        com.fasterxml.jackson.databind.JsonNode n = row.get(key);
        if (n == null || n.isNull()) return null;

        String raw = n.asText("");

        // 1) 텍스트로 뽑고, 유니코드 공백류까지 전부 제거(표준 trim이 못 지우는 NBSP 등)
        String noSpaces = raw
                .replace("\\u00A0", "")   // NBSP
                // ... (다른 replace 로직들) ...
                .replace(" ", "")
                .replace(",", "")
                .replace("+", "")         // <--- 이 줄 추가
                .replace("-", "")         // <--- 이 줄 추가 (저가는 음수가 될 수 없으므로)
                .trim();

        if (noSpaces.isEmpty()) {
            return null;
        }

        try {
            // 2) 숫자로 변환 시도
            return Integer.parseInt(noSpaces);
        } catch (NumberFormatException e) {
            // 3) 실패 시 경고 로그
            log.warn("{} 파싱 실패: key={}, raw='{}', cleaned='{}'",
                    key, raw, noSpaces, e.getMessage());
            return null;
        }
    }

    private static int parsePriceValue(String raw) {
        if (raw == null || raw.trim().isEmpty()) return 0;
        String s = raw.trim().replaceAll("[+\\-]", ""); // 모든 '+', '-' 기호 제거
        if (s.isEmpty()) return 0;
        try {
            return Integer.parseInt(s);
        } catch (NumberFormatException e) {
            logger.warn("가격 파싱 실패: {}", raw);
            return 0;
        }
    }
    
    private static long parseVolumeValue(String raw) {
        if (raw == null || raw.trim().isEmpty()) return 0;
        String s = raw.trim().replaceAll("^[+-]+", ""); // 선행 '+', '-' 전부 제거
        if (s.isEmpty()) return 0;
        try {
            return Long.parseLong(s);
        } catch (NumberFormatException e) {
            logger.warn("거래량 파싱 실패: {}", raw);
            return 0;
        }
    }
    
    private static double parseRateValue(String raw) {
        if (raw == null || raw.trim().isEmpty()) return 0.0;
        String s = raw.trim().replaceAll("^[+-]+", ""); // 선행 '+', '-' 전부 제거
        if (s.isEmpty()) return 0.0;
        try {
            return Double.parseDouble(s);
        } catch (NumberFormatException e) {
            logger.warn("변동률 파싱 실패: {}", raw);
            return 0.0;
        }
    }


    private static final Logger logger = LoggerFactory.getLogger(KiwoomApiClient.class);
    
    @Value("${kiwoom.api.appkey}")
    private String appkey;
    
    @Value("${kiwoom.api.secretkey}")
    private String secretkey;
    
    @Value("${kiwoom.api.host}")
    private String host;
    
    @Value("${kiwoom.api.timeout:10}")
    private int timeout;
    
    @Value("${kiwoom.api.retry:2}")
    private int retry;
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    public KiwoomApiClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * 토큰이 유효한지 확인
     */
    private boolean isTokenValid() {
        if (cachedToken == null || tokenExpiresDt == null) {
            return false;
        }
        
        // 현재 시간이 토큰 발급 시간으로부터 23시간 이내인지 확인 (여유시간 1시간)
        long currentTime = System.currentTimeMillis();
        long tokenAge = currentTime - tokenCacheTime;
        long maxAge = 23 * 60 * 60 * 1000; // 23시간
        
        return tokenAge < maxAge;
    }
    
    /**
     * 접근 토큰 발급 (au10001) - 캐시된 토큰이 있으면 재사용
     */
    public TokenResponse getAccessToken() {
        // 캐시된 토큰이 유효하면 재사용
        if (isTokenValid()) {
            logger.info("캐시된 토큰 재사용 (만료일: {})", tokenExpiresDt);
            return new TokenResponse(cachedToken, tokenExpiresDt);
        }
        
        // 새 토큰 발급
        return getNewAccessToken();
    }
    
    /**
     * 새로운 접근 토큰 발급 (au10001)
     */
    private TokenResponse getNewAccessToken() {
        String url = host + "/oauth2/token";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, String> body = new HashMap<>();
        body.put("grant_type", "client_credentials");
        body.put("appkey", appkey);
        body.put("secretkey", secretkey);
        
        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
        
        try {
            logger.info("키움 API 토큰 발급 요청: {}", url);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                String returnCode = jsonNode.get("return_code").asText();
                
                if ("0".equals(returnCode)) {
                    String token = jsonNode.get("token").asText();
                    String expiresDt = jsonNode.get("expires_dt").asText();
                    
                    // 토큰 캐시에 저장
                    this.cachedToken = token;
                    this.tokenExpiresDt = expiresDt;
                    this.tokenCacheTime = System.currentTimeMillis();
                    
                    logger.info("키움 API 토큰 발급 성공, 만료일: {}", expiresDt);
                    return new TokenResponse(token, expiresDt);
                } else {
                    logger.error("키움 API 토큰 발급 실패: {}", response.getBody());
                    throw new RuntimeException("키움 API 토큰 발급 실패: " + response.getBody());
                }
            } else {
                logger.error("키움 API 토큰 발급 HTTP 오류: {}", response.getStatusCode());
                throw new RuntimeException("키움 API 토큰 발급 HTTP 오류: " + response.getStatusCode());
            }
        } catch (Exception e) {
            logger.error("키움 API 토큰 발급 중 오류 발생", e);
            throw new RuntimeException("키움 API 토큰 발급 중 오류 발생", e);
        }
    }

    /**
     * 일별 주가 조회 (ka10086)
     * 네트워크 오류 발생 시 점진적으로 대기 시간을 늘려가며 최대 5회 재시도합니다.
     */
    public List<DailyPriceData> fetchDailyPrices(String token, String stockCode, String queryDate, int maxCount) {
        int maxRetries = 5;
        int baseDelay = 1000; // 1초부터 시작
        
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger.info("키움 API 일별 주가 조회 시도 {}/{}: {}", attempt, maxRetries, stockCode);
                return fetchDailyPricesInternal(token, stockCode, queryDate, maxCount);
            } catch (RestClientException e) {
                logger.warn("키움 API 네트워크 오류 발생 (시도 {}/{}): {}", attempt, maxRetries, e.getMessage());
                
                if (attempt == maxRetries) {
                    logger.error("키움 API 최대 재시도 횟수 초과, 최종 실패: {}", stockCode);
                    throw e;
                }
                
                // 점진적으로 대기 시간 증가 (1초, 2초, 4초, 8초)
                int delay = baseDelay * (int) Math.pow(2, attempt - 1);
                logger.info("{}초 후 재시도합니다...", delay);
                
                try {
                    Thread.sleep(delay);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    logger.error("재시도 대기 중 인터럽트 발생");
                    throw new RuntimeException("재시도 대기 중 인터럽트 발생", ie);
                }
            }
        }
        
        throw new RuntimeException("예상치 못한 오류: 재시도 루프를 벗어남");
    }
    
    /**
     * 실제 API 호출 로직
     */
    private List<DailyPriceData> fetchDailyPricesInternal(String token, String stockCode, String queryDate, int maxCount) {
        String url = host + "/api/dostk/mrkcond";
        List<DailyPriceData> allRows = new ArrayList<>();

        String contYn = "N";
        String nextKey = "";
        int page = 0;
        int maxPages = 100;

        while (page < maxPages) {
            page++;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", "application/json");
            // Connection: close 헤더 제거 - Connection Pooling을 위해 Keep-Alive 사용
            headers.set("authorization", "Bearer " + token);
            headers.set("cont-yn", contYn);
            headers.set("next-key", nextKey);
            headers.set("api-id", "ka10086");

            Map<String, String> body = new HashMap<>();
            body.put("stk_cd", stockCode);
            body.put("qry_dt", queryDate);
            body.put("indc_tp", "0"); // 수량 기준

            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response;
            logger.info("키움 API 일별 주가 조회 요청: {} (페이지: {})", stockCode, page);
            response = restTemplate.postForEntity(url, request, String.class);

            // 응답 파싱
            try {
                if (response.getStatusCode() == HttpStatus.OK) {
                    JsonNode jsonNode = objectMapper.readTree(response.getBody());
                    String returnCode = jsonNode.get("return_code").asText();

                    if ("0".equals(returnCode)) {
                        JsonNode dailyStkpc = jsonNode.get("daly_stkpc");
                        if (dailyStkpc != null && dailyStkpc.isArray()) {
                            for (JsonNode row : dailyStkpc) {

                                Integer low = parsePriceNonNegative(row, "low_pric");
                                if (low == null) {
                                    log.warn("low_pric 파싱 실패: code={}, date={}, raw='{}'",
                                            stockCode,
                                            row.path("date").asText(), // 날짜 키는 실제 키로 바꿔도 됨
                                            row.path("low_pric").asText());
                                }

                                DailyPriceData data = new DailyPriceData();
                                data.setDate(row.get("date").asText());
                                data.setOpenPrice(parsePriceValue(row.get("open_pric").asText()));
                                data.setHighPrice(parsePriceValue(row.get("high_pric").asText()));
                                data.setLowPrice(parsePriceValue(row.get("low_pric").asText()));
                                data.setClosePrice(parsePriceValue(row.get("close_pric").asText()));
                                data.setVolume(parseVolumeValue(row.get("trde_qty").asText()));
                                data.setChangeRate(parseRateValue(row.get("flu_rt").asText()));

                                allRows.add(data);
                            }
                        }

                        // 연속조회 여부 확인
                        String contYnHeader = response.getHeaders().getFirst("cont-yn");
                        String nextKeyHeader = response.getHeaders().getFirst("next-key");

                        if ("Y".equals(contYnHeader) && nextKeyHeader != null && !nextKeyHeader.isEmpty()) {
                            contYn = "Y";
                            nextKey = nextKeyHeader;

                            // API 호출 간격 조절
                            try {
                                Thread.sleep(1000);
                            } catch (InterruptedException e) {
                                Thread.currentThread().interrupt();
                                break;
                            }
                        } else {
                            break;
                        }

                        // 최대 개수 확인
                        if (allRows.size() >= maxCount) {
                            allRows = allRows.subList(0, maxCount);
                            break;
                        }
                    } else {
                        logger.error("키움 API 일별 주가 조회 실패: {}", response.getBody());
                        throw new RuntimeException("키움 API 일별 주가 조회 실패: " + response.getBody());
                    }
                } else {
                    logger.error("키움 API 일별 주가 조회 HTTP 오류: {}", response.getStatusCode());
                    throw new RuntimeException("키움 API 일별 주가 조회 HTTP 오류: " + response.getStatusCode());
                }
            } catch (JsonProcessingException jsonEx) {
                // JSON 파싱 실패
                log.error("API 응답 JSON 파싱 실패: {}", response.getBody(), jsonEx);
                throw new RuntimeException("API 응답 JSON 파싱 실패", jsonEx);
            } catch (Exception e) {
                // 기타 파싱 중 오류 (e.g., NullPointerException)
                logger.error("API 응답 데이터 처리 중 알 수 없는 오류 발생", e);
                throw new RuntimeException("API 응답 데이터 처리 중 알 수 없는 오류 발생", e);
            }
        }

        logger.info("키움 API 일별 주가 조회 완료: {} 건", allRows.size());
        return allRows;
    }
    
    /**
     * 오늘 날짜를 YYYYMMDD 형식으로 반환 (KST)
     */
    public String getTodayYYYYMMDD() {
        return LocalDateTime.now(ZoneId.of("Asia/Seoul"))
                .format(DateTimeFormatter.ofPattern("yyyyMMdd"));
    }
    
    /**
     * 토큰 응답 클래스
     */
    public static class TokenResponse {
        private final String token;
        private final String expiresDt;
        
        public TokenResponse(String token, String expiresDt) {
            this.token = token;
            this.expiresDt = expiresDt;
        }
        
        public String getToken() {
            return token;
        }
        
        public String getExpiresDt() {
            return expiresDt;
        }
    }
    
    /**
     * 일별 주가 데이터 클래스
     */
    public static class DailyPriceData {
        private String date;
        private int openPrice;
        private int highPrice;
        private int lowPrice;
        private int closePrice;
        private long volume;
        private double changeRate;
        
        // Getters and Setters
        public String getDate() {
            return date;
        }
        
        public void setDate(String date) {
            this.date = date;
        }
        
        public int getOpenPrice() {
            return openPrice;
        }
        
        public void setOpenPrice(int openPrice) {
            this.openPrice = openPrice;
        }
        
        public int getHighPrice() {
            return highPrice;
        }
        
        public void setHighPrice(int highPrice) {
            this.highPrice = highPrice;
        }
        
        public int getLowPrice() {
            return lowPrice;
        }
        
        public void setLowPrice(int lowPrice) {
            this.lowPrice = lowPrice;
        }
        
        public int getClosePrice() {
            return closePrice;
        }
        
        public void setClosePrice(int closePrice) {
            this.closePrice = closePrice;
        }
        
        public long getVolume() {
            return volume;
        }
        
        public void setVolume(long volume) {
            this.volume = volume;
        }
        
        public double getChangeRate() {
            return changeRate;
        }
        
        public void setChangeRate(double changeRate) {
            this.changeRate = changeRate;
        }
    }
}
