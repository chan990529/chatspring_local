package com.chatspring.chatspring.scalping.stock.scalping;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/trades")
public class VirtualTradeController {

    @Autowired
    private VirtualTradeService virtualTradeService;

    @GetMapping("/{id}")
    public VirtualTrade getTradeById(@PathVariable Long id) {
        return virtualTradeService.findById(id);
    }

    @PostMapping
    public VirtualTrade createTrade(@RequestBody VirtualTrade trade) {
        return virtualTradeService.save(trade);
    }

    @DeleteMapping("/{id}")
    public void deleteTrade(@PathVariable Long id) {
        virtualTradeService.delete(id);
    }

    @GetMapping
    public List<VirtualTrade> getTradesByDate(
            @RequestParam(value = "date", required = false) String date  // Optional date
    ) {
        // date가 넘어오면 서버 사이드 필터링 적용
        if (date != null && !date.isBlank()) {
            // "2025-05-10" 형태로 받은 문자열을 LocalDate로 파싱
            LocalDate day = LocalDate.parse(date);
            // 해당 날짜의 시작 시각
            LocalDateTime start = day.atStartOfDay();
            // 해당 날짜의 종료 시각 (23:59:59)
            LocalDateTime end = day.atTime(23, 59, 59);
            // 서비스 레이어를 통해 범위 조회
            return virtualTradeService.findByBuyTimeBetween(start, end);
        }
        // date 파라미터가 없을 땐 모든 거래를 리턴 (기존 동작 유지)
        return virtualTradeService.findAll();
    }

    @GetMapping("/search/by-code")
    public List<VirtualTrade> findTradesByStockCode_today(@RequestParam String stockCode) {
        return virtualTradeService.findByStockCode_today(stockCode);
    }

    @GetMapping("/search")
    public List<VirtualTrade> findByStockName(@RequestParam String stockName) {
        return virtualTradeService.findByStockName(stockName);
    }

    @GetMapping("/search/by-name-exact")
    public List<VirtualTrade> findTradesByStockNameExact(@RequestParam String stockName) {
        return virtualTradeService.findByStockNameExact(stockName);
    }

    @GetMapping("/filterByDate")
    public List<VirtualTrade> findByBuyTimeBetween(@RequestParam String startDate,
                                                   @RequestParam String endDate) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
        LocalDateTime start = LocalDateTime.parse(startDate, formatter);
        LocalDateTime end = LocalDateTime.parse(endDate, formatter);
        return virtualTradeService.findByBuyTimeBetween(start, end);
    }

    @GetMapping("/autocomplete")
    public List<String> autocompleteStockNames(@RequestParam String query) {
        return virtualTradeService.findStockNamesByQuery(query);
    }
}