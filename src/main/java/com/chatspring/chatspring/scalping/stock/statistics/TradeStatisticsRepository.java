package com.chatspring.chatspring.scalping.stock.statistics;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface TradeStatisticsRepository extends JpaRepository<TradeStatistics, Long> {
    TradeStatistics findByDate(LocalDate date);
}

