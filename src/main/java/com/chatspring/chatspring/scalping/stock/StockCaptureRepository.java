package com.chatspring.chatspring.scalping.stock;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockCaptureRepository extends JpaRepository<StockCapture, Long> {


    // 이름으로 검색
    List<StockCapture> findByStockNameContainingIgnoreCase(String stockName);

    // 날짜로 필터링
    @Query("SELECT s FROM StockCapture s WHERE s.captureDate BETWEEN :startDate AND :endDate")
    List<StockCapture> findByCaptureDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
