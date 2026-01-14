package com.chatspring.chatspring.jugot;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JugotRepository extends JpaRepository<Jugot, Long> {
    // 수정: 캡처일 기준 기간 조회 메서드 추가
    List<Jugot> findByCaptureDateBetween(LocalDate start, LocalDate end);
    
    // 올해 종목들 조회
    @Query("SELECT j FROM Jugot j WHERE YEAR(j.captureDate) = :year")
    List<Jugot> findByCaptureDateYear(@Param("year") int year);
    
    // 종목코드로 조회
    Optional<Jugot> findByStockCode(String stockCode);
    
    // 포착일과 종목명으로 중복 조회
    Optional<Jugot> findByStockNameAndCaptureDate(String stockName, LocalDate captureDate);
    
    // 종목명으로 검색 (LIKE 검색)
    @Query("SELECT DISTINCT j.stockName, j.stockCode FROM Jugot j WHERE j.stockName LIKE CONCAT('%', :keyword, '%') ORDER BY j.stockName")
    List<Object[]> findDistinctStockNameAndCodeByStockNameContaining(@Param("keyword") String keyword);
    
    // 최근 종목 목록 조회 (중복 제거)
    @Query("SELECT DISTINCT j.stockName, j.stockCode FROM Jugot j ORDER BY j.captureDate DESC")
    List<Object[]> findDistinctStocksOrderByDateDesc();
    
    // 종목코드와 포착일로 조회
    Optional<Jugot> findByStockCodeAndCaptureDate(String stockCode, LocalDate captureDate);
    
    // 종목코드로 가장 최신 데이터 조회
    @Query("SELECT j FROM Jugot j WHERE j.stockCode = :stockCode ORDER BY j.captureDate DESC")
    List<Jugot> findByStockCodeOrderByCaptureDateDesc(@Param("stockCode") String stockCode);
}
