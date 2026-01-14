package com.chatspring.chatspring.scalping.stock;

import com.chatspring.chatspring.scalping.stock.dto.DailyCandleDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-data")
public class StockDataController {

    private final StockDataService stockDataService;

    public StockDataController(StockDataService stockDataService) {
        this.stockDataService = stockDataService;
    }

    @GetMapping("/daily/{stockCode}")
    public ResponseEntity<List<DailyCandleDto>> getDailyStockData(@PathVariable String stockCode) {
        try {
            List<DailyCandleDto> dailyData = stockDataService.getDailyDataFromPython(stockCode);
            return ResponseEntity.ok(dailyData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/daily/push/{stockCode}")
    public ResponseEntity<Void> pushDailyData(
            @PathVariable String stockCode,
            @RequestBody List<DailyCandleDto> candles) {

        try {
            // 서비스 계층에 데이터를 전달하여 캐싱 작업을 위임
            stockDataService.cacheDailyData(stockCode, candles);
            // 성공적으로 처리되었음을 알리는 200 OK 응답 반환
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            // 로깅 추가
            System.err.println("Error while caching daily data: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

}