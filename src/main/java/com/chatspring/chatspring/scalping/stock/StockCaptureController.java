package com.chatspring.chatspring.scalping.stock;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/stocks")
public class StockCaptureController {

    @Autowired
    private StockCaptureService stockCaptureService;  // 서비스 주입

    @GetMapping
    public List<StockCapture> getAllStocks() {
        return stockCaptureService.getAllStocks();
    }

    @PostMapping
    public StockCapture createStock(@RequestBody StockCapture stockCapture) {
        return stockCaptureService.createStock(stockCapture);
    }

    @PutMapping("/{id}")
    public StockCapture updateStock(@PathVariable Long id, @RequestBody StockCapture stockCapture) {
        return stockCaptureService.updateStock(id, stockCapture);
    }

    @DeleteMapping("/{id}")
    public void deleteStock(@PathVariable Long id) {
        stockCaptureService.deleteStock(id);
    }

    // 이름으로 검색
    @GetMapping("/search")
    public List<StockCapture> searchStocksByName(@RequestParam String name) {
        return stockCaptureService.searchStocksByName(name);
    }

    // 날짜 필터링
    @GetMapping("/filter")
    public List<StockCapture> filterStocksByDate(
            @RequestParam String startDate,
            @RequestParam String endDate
    ) {
        return stockCaptureService.filterStocksByDate(LocalDate.parse(startDate), LocalDate.parse(endDate));
    }

    // 선택된 항목 삭제
    @PostMapping("/delete")
    public ResponseEntity<Void> deleteSelectedStocks(@RequestBody Map<String, List<Long>> requestBody) {
        List<Long> idsToDelete = requestBody.get("ids");
        stockCaptureService.deleteAllByIds(idsToDelete);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/batch")
    public ResponseEntity<List<StockCapture>> createStocksBatch(@RequestBody List<StockCapture> stockCaptures) {
        List<StockCapture> createdStocks = stockCaptureService.createStocksBatch(stockCaptures);
        return ResponseEntity.ok(createdStocks);
    }
}
