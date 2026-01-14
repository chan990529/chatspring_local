package com.chatspring.chatspring.scalping.stock;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class StockCaptureService {

    @Autowired
    private StockCaptureRepository stockCaptureRepository;

    public List<StockCapture> getAllStocks() {
        return stockCaptureRepository.findAll();
    }

    public StockCapture createStock(StockCapture stockCapture) {
        return stockCaptureRepository.save(stockCapture);
    }

    public StockCapture updateStock(Long id, StockCapture stockCaptureDetails) {
        Optional<StockCapture> stockCapture = stockCaptureRepository.findById(id);
        if (stockCapture.isPresent()) {
            StockCapture updatedStock = stockCapture.get();
            updatedStock.setStockName(stockCaptureDetails.getStockName());
            updatedStock.setCaptureDate(stockCaptureDetails.getCaptureDate());
            updatedStock.setCapturePrice(stockCaptureDetails.getCapturePrice());
            return stockCaptureRepository.save(updatedStock);
        }
        return null;
    }

    public void deleteStock(Long id) {
        stockCaptureRepository.deleteById(id);
    }

    // 이름으로 검색
    public List<StockCapture> searchStocksByName(String name) {
        return stockCaptureRepository.findByStockNameContainingIgnoreCase(name);
    }

    // 날짜로 필터링
    public List<StockCapture> filterStocksByDate(LocalDate startDate, LocalDate endDate) {
        return stockCaptureRepository.findByCaptureDateBetween(startDate, endDate);
    }

    public void deleteAllByIds(List<Long> idsToDelete) {
        stockCaptureRepository.deleteAllById(idsToDelete);
    }

    public List<StockCapture> createStocksBatch(List<StockCapture> stockCaptures) {
        return stockCaptureRepository.saveAll(stockCaptures);
    }


}
