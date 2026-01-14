package com.chatspring.chatspring.scalping.stock.scalping;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface VirtualTradeRepository extends JpaRepository<VirtualTrade, Long> {

    List<VirtualTrade> findByStockCodeContainingIgnoreCaseAndBuyTimeBetween(String stockCode, LocalDateTime startDate, LocalDateTime endDate);

    // 주식 코드로 검색 (대소문자 구분 없이)
    List<VirtualTrade> findByStockCodeContainingIgnoreCase(String stockCode);

    // 특정 기간 동안의 거래 내역 조회
    @Query("SELECT v FROM VirtualTrade v WHERE v.buyTime BETWEEN :startDate AND :endDate")
    List<VirtualTrade> findByBuyTimeBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    List<VirtualTrade> findByStockNameContainingIgnoreCase(String stockName);

    @Query("SELECT DISTINCT v.stockName FROM VirtualTrade v "
            + "WHERE LOWER(v.stockName) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<String> findStockNamesByQuery(@Param("query") String query, Pageable pageable);

    // [추가] 이름 정확히 일치 검색
    List<VirtualTrade> findByStockName(String stockName);

    @Query("SELECT new com.chatspring.chatspring.scalping.stock.scalping.SonggotCaptureCountDto(v.stockName, COUNT(v.id)) " +
            "FROM VirtualTrade v " +
            "WHERE v.stockName IN :stockNames AND v.buyTime >= :ninetyDaysAgo " +
            "GROUP BY v.stockName")
    List<SonggotCaptureCountDto> countTotalCapturesInLast90Days(
            @Param("stockNames") List<String> stockNames,
            @Param("ninetyDaysAgo") LocalDateTime ninetyDaysAgo
    );

}