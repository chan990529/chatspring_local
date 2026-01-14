package com.chatspring.chatspring.kiwoom;

import com.chatspring.chatspring.jugot.Jugot;
import com.chatspring.chatspring.jugot.JugotRepository;
import com.chatspring.chatspring.jugot.RealTrade;
import com.chatspring.chatspring.jugot.RealTradeRepository;
import com.chatspring.chatspring.jugot.RealTradeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class StockDataUpdateService {
    
    private static final Logger logger = LoggerFactory.getLogger(StockDataUpdateService.class);
    
    @Autowired
    private KiwoomApiClient kiwoomApiClient;
    
    @Autowired
    private JugotRepository jugotRepository;
    
    @Autowired
    private RealTradeRepository realTradeRepository;
    
    @Autowired
    private RealTradeService realTradeService;
    
    @Autowired
    private StockUpdateStatusService stockUpdateStatusService;
    
    /**
     * 매일 평일 15:30에 실행되는 스케줄러
     * 각 종목의 포착일부터 오늘까지의 데이터를 조회하여 DB 업데이트
     */
    @Scheduled(cron = "0 05 18 * * MON-FRI", zone = "Asia/Seoul")
    public void updateStockDataDaily() {
        long startTime = System.currentTimeMillis();
        logger.info("주식 데이터 일일 업데이트 시작");
        
        // 업데이트 상태 시작
        stockUpdateStatusService.startUpdate();
        
        try {
            // 1. 토큰 발급
            KiwoomApiClient.TokenResponse tokenResponse = kiwoomApiClient.getAccessToken();
            String token = tokenResponse.getToken();
            
            // 2. 모든 종목들 조회
            List<Jugot> allStocks = jugotRepository.findAll();
            logger.info("전체 종목 수: {} 개", allStocks.size());
            
            // 3. 각 종목별로 데이터 업데이트
            for (Jugot stock : allStocks) {
                try {
                    updateStockData(stock, token);
                    // API 호출 간격 조절 (0.1초)
                    Thread.sleep(3000);
                } catch (Exception e) {
                    logger.error("종목 {} 데이터 업데이트 실패: {}", stock.getStockCode(), e.getMessage());
                }
            }
            
            logger.info("주식 데이터 일일 업데이트 완료");
            
            // 4. RealTrade의 currentPrice 업데이트
            try {
                logger.info("RealTrade currentPrice 업데이트 시작");
                updateRealTradeCurrentPrice(token);
            } catch (Exception e) {
                logger.error("RealTrade currentPrice 업데이트 중 오류 발생", e);
            }
            
        } catch (Exception e) {
            logger.error("주식 데이터 일일 업데이트 중 오류 발생", e);
        } finally {
            // 4. 월요일이면 RealTrade 평단가 업데이트 (Jugot 업데이트 완료 후 반드시 실행)
            try {
                LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
                if (today.getDayOfWeek() == DayOfWeek.FRIDAY) {
                    logger.info("월요일 감지: RealTrade 평단가 업데이트 시작");
                    // 토큰이 필요하므로 다시 발급 (이미 캐시되어 있을 가능성 높음)
                    KiwoomApiClient.TokenResponse tokenResponse = kiwoomApiClient.getAccessToken();
                    String token = tokenResponse.getToken();
                    updateRealTradeAveragePrice(token);
                }
            } catch (Exception e) {
                logger.error("RealTrade 평단가 업데이트 중 오류 발생", e);
            }
            
            // 업데이트 상태 종료
            stockUpdateStatusService.endUpdate();
            long endTime = System.currentTimeMillis();
            long elapsedTime = endTime - startTime;
            long minutes = elapsedTime / 60000;
            long seconds = (elapsedTime % 60000) / 1000;
            logger.info("주식 데이터 일일 업데이트 완료 및 상태 해제 - 총 소요 시간: {}분 {}초 ({}ms)", minutes, seconds, elapsedTime);
        }
    }
    
    /**
     * 올해 종목들 조회
     */
    public List<Jugot> getCurrentYearStocks() {
        int currentYear = LocalDate.now().getYear();
        return jugotRepository.findByCaptureDateYear(currentYear);
    }
    
    /**
     * 개별 종목 데이터 업데이트
     */
    private void updateStockData(Jugot stock, String token) {
        String stockCode = stock.getStockCode();
        
        try {
            String queryDate = kiwoomApiClient.getTodayYYYYMMDD();
            LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
            LocalDate captureDate = stock.getCaptureDate();
            
            // 포착일부터 오늘까지의 일수 계산
            long daysBetween = ChronoUnit.DAYS.between(captureDate, today);
            // 최소 1일, 최대 365일로 제한 (너무 오래된 데이터는 제한)
            int maxCount = (int) Math.max(1, Math.min(daysBetween + 1, 365));
            
            logger.info("종목 {} 데이터 조회 시작 (포착일: {}, 오늘: {}, 조회일수: {})", 
                stockCode, captureDate, today, maxCount);
            
            // 포착일부터 오늘까지의 데이터 조회 (재시도 로직이 내장되어 있음)
            List<KiwoomApiClient.DailyPriceData> dailyPrices = 
                kiwoomApiClient.fetchDailyPrices(token, stockCode, queryDate, maxCount);
            
            if (dailyPrices.isEmpty()) {
                logger.warn("종목 {} 데이터가 없습니다", stockCode);
                // 데이터가 없을 때 기본값 설정
                Integer existingHighestPrice = stock.getHighestPrice();
                Integer existingLowestPrice = stock.getLowestPrice();
                stock.setCurrentPrice(0);
                stock.setHighestPrice(existingHighestPrice != null ? existingHighestPrice : 0);
                stock.setLowestPrice(existingLowestPrice != null ? existingLowestPrice : Integer.MAX_VALUE);
                jugotRepository.save(stock);
                return;
            }
            
            // 당일 데이터 찾기 (가장 최근 데이터)
            KiwoomApiClient.DailyPriceData todayData = dailyPrices.get(0);
            int currentPrice = todayData.getClosePrice();
            if (currentPrice <= 0) {
                currentPrice = 0;
            }
            
            // 포착일부터 오늘까지의 최고가, 최저가 계산
            Integer existingHighestPrice = stock.getHighestPrice();
            int highestPrice = dailyPrices.stream()
                .mapToInt(KiwoomApiClient.DailyPriceData::getHighPrice)
                .max()
                .orElse(existingHighestPrice != null ? existingHighestPrice : 0);
            
            int lowestPrice = dailyPrices.stream()
                .mapToInt(KiwoomApiClient.DailyPriceData::getLowPrice)
                .min()
                .orElse(Integer.MAX_VALUE);
            
            // DB 업데이트
            stock.setCurrentPrice(currentPrice);
            
            // 최고가 업데이트: 기존 값이 null이면 새 값(또는 0), 아니면 둘 중 큰 값
            if (existingHighestPrice == null) {
                stock.setHighestPrice(highestPrice > 0 ? highestPrice : 0);
            } else {
                stock.setHighestPrice(Math.max(existingHighestPrice, highestPrice));
            }
            
            // 최저가 로직: 기존 값이 null이면 새 값(또는 Integer.MAX_VALUE), 아니면 둘 중 작은 값
            Integer existingLowest = stock.getLowestPrice();
            if (existingLowest == null) {
                stock.setLowestPrice(lowestPrice < Integer.MAX_VALUE ? lowestPrice : Integer.MAX_VALUE);
            } else {
                // 기존 최저가와 비교하여 더 낮은 값으로 업데이트
                int newLowest = lowestPrice < Integer.MAX_VALUE ? lowestPrice : existingLowest;
                stock.setLowestPrice(Math.min(existingLowest, newLowest));
            }
            
            jugotRepository.save(stock);
            
            logger.info("종목 {} 업데이트 완료 - 현재가: {}, 최고가: {}, 최저가: {}", 
                stockCode, todayData.getClosePrice(), stock.getHighestPrice(), stock.getLowestPrice());
            
        } catch (org.springframework.web.client.ResourceAccessException e) {
            // 네트워크 오류 - 이미 재시도가 완료된 상태
            logger.error("종목 {} 네트워크 오류로 데이터 업데이트 실패 (재시도 완료): {}", stockCode, e.getMessage());
            // 네트워크 오류는 재시도가 이미 완료되었으므로 예외를 다시 던지지 않음
        } catch (Exception e) {
            // 기타 예외 (JSON 파싱 오류, DB 오류 등)
            logger.error("종목 {} 데이터 업데이트 중 예상치 못한 오류 발생: {}", stockCode, e.getMessage(), e);
            // 기타 예외는 다시 던져서 상위에서 처리하도록 함
            throw e;
        }
    }
    
    /**
     * RealTrade의 평단가 업데이트 (매주 월요일 실행)
     * 각 RealTrade 종목에 대해 그 날(월요일)의 종가로 1주 매수 가정하여 평단가 계산
     * 주의: ACTIVE 상태인 항목만 업데이트되며, PAUSED(중단) 또는 COMPLETED(완료) 상태는 제외됩니다.
     */
    private void updateRealTradeAveragePrice(String token) {
        long startTime = System.currentTimeMillis();
        try {
            // ACTIVE 상태인 RealTrade 목록 조회 (PAUSED, COMPLETED 상태는 제외)
            List<RealTrade> activeRealTrades = realTradeRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
            logger.info("RealTrade 평단가 업데이트 대상: {} 개", activeRealTrades.size());
            
            if (activeRealTrades.isEmpty()) {
                logger.info("업데이트할 RealTrade가 없습니다.");
                return;
            }
            
            String queryDate = kiwoomApiClient.getTodayYYYYMMDD();
            LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
            
            for (RealTrade realTrade : activeRealTrades) {
                try {
                    String stockCode = realTrade.getStockCode();
                    logger.info("RealTrade 평단가 업데이트 시작: {} ({})", stockCode, realTrade.getStockName());
                    
                    // 당일 주가 데이터 조회 (1일치만 필요)
                    List<KiwoomApiClient.DailyPriceData> dailyPrices = 
                        kiwoomApiClient.fetchDailyPrices(token, stockCode, queryDate, 1);
                    
                    if (dailyPrices.isEmpty()) {
                        logger.warn("RealTrade {} ({})의 주가 데이터를 가져올 수 없습니다.", stockCode, realTrade.getStockName());
                        continue;
                    }
                    
                    // 당일 종가 가져오기
                    KiwoomApiClient.DailyPriceData todayData = dailyPrices.get(0);
                    int closePrice = todayData.getClosePrice();
                    
                    // 평단가 계산: 기존 평단가가 있으면 가중평균, 없으면 종가가 평단가
                    Integer existingAveragePrice = realTrade.getAveragePrice();
                    Integer existingBuyCount = realTrade.getCurrentBuyCount() != null ? realTrade.getCurrentBuyCount() : 0;
                    int newBuyCount = realTrade.getTargetBuyCount() != null ? realTrade.getTargetBuyCount() : 1; // target_buy_count만큼 매수
                    
                    int newAveragePrice;
                    int totalBuyCount;
                    
                    if (existingAveragePrice != null && existingAveragePrice > 0 && existingBuyCount > 0) {
                        // 기존 평단가가 있는 경우: 가중평균 계산
                        // (기존평단가 * 기존수량 + 신규매수가 * 신규수량) / (기존수량 + 신규수량)
                        long totalCost = (long) existingAveragePrice * existingBuyCount + (long) closePrice * newBuyCount;
                        totalBuyCount = existingBuyCount + newBuyCount;
                        newAveragePrice = (int) (totalCost / totalBuyCount);
                        
                        logger.info("RealTrade {} 평단가 업데이트: 기존 평단가={}, 기존 매수횟수={}, 신규 매수가={}, 신규 매수횟수={}, 새 평단가={}, 총 매수횟수={}",
                            stockCode, existingAveragePrice, existingBuyCount, closePrice, newBuyCount, newAveragePrice, totalBuyCount);
                    } else {
                        // 기존 평단가가 없는 경우: 종가가 평단가
                        newAveragePrice = closePrice;
                        totalBuyCount = newBuyCount;
                        
                        logger.info("RealTrade {} 평단가 초기화: 매수가={}, 매수횟수={}",
                            stockCode, newAveragePrice, totalBuyCount);
                    }
                    
                    // DB 업데이트
                    realTrade.setAveragePrice(newAveragePrice);
                    realTrade.setCurrentBuyCount(totalBuyCount);
                    realTradeRepository.save(realTrade);
                    
                    logger.info("RealTrade {} 평단가 업데이트 완료: 평단가={}, 매수횟수={}", 
                        stockCode, newAveragePrice, totalBuyCount);
                    
                    // API 호출 간격 조절
                    Thread.sleep(3000);
                    
                } catch (Exception e) {
                    logger.error("RealTrade {} 평단가 업데이트 실패: {}", realTrade.getStockCode(), e.getMessage(), e);
                }
            }
            
            long endTime = System.currentTimeMillis();
            long elapsedTime = endTime - startTime;
            long minutes = elapsedTime / 60000;
            long seconds = (elapsedTime % 60000) / 1000;
            logger.info("RealTrade 평단가 업데이트 완료 - 소요 시간: {}분 {}초 ({}ms)", minutes, seconds, elapsedTime);
            
        } catch (Exception e) {
            long endTime = System.currentTimeMillis();
            long elapsedTime = endTime - startTime;
            logger.error("RealTrade 평단가 업데이트 중 오류 발생 (소요 시간: {}ms)", elapsedTime, e);
        }
    }
    
    /**
     * RealTrade의 currentPrice 업데이트 (매일 실행)
     * 각 RealTrade 종목에 대해 당일 종가로 currentPrice 업데이트
     * 주의: ACTIVE 상태인 항목만 업데이트되며, PAUSED(중단) 또는 COMPLETED(완료) 상태는 제외됩니다.
     */
    private void updateRealTradeCurrentPrice(String token) {
        long startTime = System.currentTimeMillis();
        try {
            // ACTIVE 상태인 RealTrade 목록 조회 (PAUSED, COMPLETED 상태는 제외)
            List<RealTrade> activeRealTrades = realTradeRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
            logger.info("RealTrade currentPrice 업데이트 대상: {} 개", activeRealTrades.size());
            
            if (activeRealTrades.isEmpty()) {
                logger.info("업데이트할 RealTrade가 없습니다.");
                return;
            }
            
            String queryDate = kiwoomApiClient.getTodayYYYYMMDD();
            
            for (RealTrade realTrade : activeRealTrades) {
                try {
                    String stockCode = realTrade.getStockCode();
                    logger.info("RealTrade currentPrice 업데이트 시작: {} ({})", stockCode, realTrade.getStockName());
                    
                    // 당일 주가 데이터 조회 (1일치만 필요)
                    List<KiwoomApiClient.DailyPriceData> dailyPrices = 
                        kiwoomApiClient.fetchDailyPrices(token, stockCode, queryDate, 1);
                    
                    if (dailyPrices.isEmpty()) {
                        logger.warn("RealTrade {} ({})의 주가 데이터를 가져올 수 없습니다.", stockCode, realTrade.getStockName());
                        continue;
                    }
                    
                    // 당일 종가 가져오기
                    KiwoomApiClient.DailyPriceData todayData = dailyPrices.get(0);
                    int closePrice = todayData.getClosePrice();
                    
                    // DB 업데이트
                    realTrade.setCurrentPrice(closePrice);
                    realTradeRepository.save(realTrade);
                    
                    logger.info("RealTrade {} currentPrice 업데이트 완료: currentPrice={}", 
                        stockCode, closePrice);
                    
                    // 수익률 계산 및 자동 중단 체크 (5% 이상이면 자동 중단)
                    try {
                        // buyPrice 조회 (startDate와 일치하는 Jugot의 capturePrice)
                        Integer buyPrice = null;
                        if (realTrade.getStartDate() != null) {
                            Optional<Jugot> startJugot = jugotRepository.findByStockCodeAndCaptureDate(
                                realTrade.getStockCode(), realTrade.getStartDate()
                            );
                            if (startJugot.isPresent()) {
                                buyPrice = startJugot.get().getCapturePrice();
                            }
                        }
                        
                        // buyPrice가 있고 currentPrice가 있으면 수익률 계산
                        if (buyPrice != null && buyPrice > 0 && closePrice > 0) {
                            double profitRate = ((double)(closePrice - buyPrice) / buyPrice) * 100;
                            
                            logger.info("RealTrade {} 수익률 계산: buyPrice={}, currentPrice={}, profitRate={}%", 
                                stockCode, buyPrice, closePrice, String.format("%.2f", profitRate));
                            
                            // 수익률이 5% 이상이면 자동으로 PAUSED 상태로 변경
                            if (profitRate >= 5.0) {
                                logger.info("RealTrade {} 수익률이 5% 이상({}%)이므로 자동 중단 처리", 
                                    stockCode, String.format("%.2f", profitRate));
                                realTradeService.pauseRealTrade(realTrade.getId());
                                logger.info("RealTrade {} 자동 중단 완료 (PAUSED 상태로 변경)", stockCode);
                            }
                        } else {
                            logger.debug("RealTrade {} 수익률 계산 불가: buyPrice={}, currentPrice={}", 
                                stockCode, buyPrice, closePrice);
                        }
                    } catch (Exception e) {
                        logger.error("RealTrade {} 수익률 계산 및 자동 중단 체크 중 오류 발생: {}", 
                            stockCode, e.getMessage(), e);
                        // 수익률 계산 오류는 전체 프로세스를 중단하지 않음
                    }
                    
                    // API 호출 간격 조절
                    Thread.sleep(3000);
                    
                } catch (Exception e) {
                    logger.error("RealTrade {} currentPrice 업데이트 실패: {}", realTrade.getStockCode(), e.getMessage(), e);
                }
            }
            
            long endTime = System.currentTimeMillis();
            long elapsedTime = endTime - startTime;
            long minutes = elapsedTime / 60000;
            long seconds = (elapsedTime % 60000) / 1000;
            logger.info("RealTrade currentPrice 업데이트 완료 - 소요 시간: {}분 {}초 ({}ms)", minutes, seconds, elapsedTime);
            
        } catch (Exception e) {
            long endTime = System.currentTimeMillis();
            long elapsedTime = endTime - startTime;
            logger.error("RealTrade currentPrice 업데이트 중 오류 발생 (소요 시간: {}ms)", elapsedTime, e);
        }
    }
    
    /**
     * 수동으로 특정 종목 데이터 업데이트 (테스트용)
     */
    public void updateSpecificStock(String stockCode) {
        logger.info("종목 {} 수동 업데이트 시작", stockCode);
        
        try {
            // 토큰 발급 (캐시된 토큰 재사용)
            KiwoomApiClient.TokenResponse tokenResponse = kiwoomApiClient.getAccessToken();
            String token = tokenResponse.getToken();
            
            // 종목 조회
            Optional<Jugot> stockOpt = jugotRepository.findByStockCode(stockCode);
            if (stockOpt.isEmpty()) {
                logger.warn("종목 {} 을 찾을 수 없습니다", stockCode);
                return;
            }
            
            Jugot stock = stockOpt.get();
            updateStockData(stock, token);
            
            logger.info("종목 {} 수동 업데이트 완료", stockCode);
            
        } catch (Exception e) {
            logger.error("종목 {} 수동 업데이트 중 오류 발생", stockCode, e);
            throw e;
        }
    }
}
