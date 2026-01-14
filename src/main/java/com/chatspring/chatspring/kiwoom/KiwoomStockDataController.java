package com.chatspring.chatspring.kiwoom;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import com.chatspring.chatspring.jugot.Jugot;

@RestController
@RequestMapping("/api/kiwoom")
public class KiwoomStockDataController {
    
    private static final Logger logger = LoggerFactory.getLogger(KiwoomStockDataController.class);
    
    @Autowired
    private StockDataUpdateService stockDataUpdateService;
    
    /**
     * 특정 종목 데이터 수동 업데이트
     */
    @RequestMapping(value = "/update/{stockCode}", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, Object>> updateStockData(@PathVariable String stockCode) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            stockDataUpdateService.updateSpecificStock(stockCode);
            
            response.put("success", true);
            response.put("message", "종목 " + stockCode + " 데이터 업데이트 완료");
            response.put("stockCode", stockCode);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("종목 {} 데이터 업데이트 실패", stockCode, e);
            
            response.put("success", false);
            response.put("message", "종목 " + stockCode + " 데이터 업데이트 실패: " + e.getMessage());
            response.put("stockCode", stockCode);
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 모든 올해 종목 데이터 수동 업데이트 (테스트용)
     */
    @RequestMapping(value = "/update-all", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, Object>> updateAllStockData() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            stockDataUpdateService.updateStockDataDaily();
            
            response.put("success", true);
            response.put("message", "모든 종목 데이터 업데이트 완료");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("모든 종목 데이터 업데이트 실패", e);
            
            response.put("success", false);
            response.put("message", "모든 종목 데이터 업데이트 실패: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 간단한 테스트 API (키움 API 호출 없이)
     */
    @RequestMapping(value = "/test", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, Object>> testApi() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 올해 종목 수 조회
            List<Jugot> currentYearStocks = stockDataUpdateService.getCurrentYearStocks();
            
            response.put("success", true);
            response.put("message", "테스트 성공");
            response.put("currentYearStocksCount", currentYearStocks.size());
            response.put("stocks", currentYearStocks.stream()
                .map(stock -> Map.of(
                    "stockCode", stock.getStockCode(),
                    "stockName", stock.getStockName(),
                    "currentPrice", stock.getCurrentPrice(),
                    "captureDate", stock.getCaptureDate()
                ))
                .toList());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("테스트 API 실패", e);
            
            response.put("success", false);
            response.put("message", "테스트 실패: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
