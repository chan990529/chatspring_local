package com.chatspring.chatspring.scalping.stock.statistics;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trades/statistics")
public class TradeStatisticsController {

    private final TradeStatisticsService tradeStatisticsService;

    @Autowired
    public TradeStatisticsController(TradeStatisticsService tradeStatisticsService) {
        this.tradeStatisticsService = tradeStatisticsService;
    }

    @PostMapping
    public ResponseEntity<String> receiveStatistics(@RequestBody Map<String, Object> statistics) {
        try {
            tradeStatisticsService.saveStatistics(statistics);
            return new ResponseEntity<>("Statistics received and saved successfully.", HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to save statistics.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getStatistics(@RequestParam(value = "date", required = false) String date) {
        try {
            Map<String, Object> statistics;

            if (date != null) {
                // 특정 날짜의 통계를 가져오는 서비스 메서드 호출
                statistics = tradeStatisticsService.getStatisticsForDate(LocalDate.parse(date));
            } else {
                // 날짜가 없으면 오늘 날짜 통계 가져오기
                statistics = tradeStatisticsService.getStatisticsForToday();
            }

            return new ResponseEntity<>(statistics, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 최근 N일치 통계 데이터를 GET으로 반환하는 엔드포인트 (예: 승률)
    // 프론트엔드에서는 /api/trades/statistics/history?days=10 와 같이 호출
    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getStatisticsHistory(
            @RequestParam(value = "days", required = false, defaultValue = "10") int days,
            @RequestParam(value = "date", required = false) String date) {
        try {
            LocalDate baseDate = (date != null) ? LocalDate.parse(date) : LocalDate.now();
            List<Map<String, Object>> historyData = tradeStatisticsService.getStatisticsHistory(days, baseDate);
            return new ResponseEntity<>(historyData, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @GetMapping("/time-based")
    public ResponseEntity<Map<String, Double>> getTimeBasedWinRatios(@RequestParam(value = "date", required = false) String date) {
        LocalDate targetDate = (date != null) ? LocalDate.parse(date) : LocalDate.now();
        try {
            Map<String, Double> ratios = tradeStatisticsService.calculateTimeBasedWinRatios(targetDate);
            return new ResponseEntity<>(ratios, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}