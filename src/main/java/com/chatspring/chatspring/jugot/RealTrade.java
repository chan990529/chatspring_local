package com.chatspring.chatspring.jugot;

import com.chatspring.chatspring.jugot.user.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "real_trade")
public class RealTrade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stock_name", nullable = false)
    private String stockName;

    @Column(name = "stock_code", nullable = false)
    private String stockCode;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "invest_per", nullable = false)
    private Integer investPer;

    @OneToMany(mappedBy = "realTrade", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<TradeParticipant> participants = new ArrayList<>();

    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "average_price")
    private Integer averagePrice;

    @Column(name = "current_buy_count")
    private Integer currentBuyCount = 0;

    @Column(name = "target_buy_count")
    private Integer targetBuyCount;

    @Column(name = "current_price")
    private Integer currentPrice;

    @Column(name = "final_return_rate")
    private Double finalReturnRate;

    @Column(name = "final_period")
    private Integer finalPeriod;

    @PrePersist
    protected void onCreate() {
        if (status == null || status.isEmpty()) {
            status = "ACTIVE";
        }
        createdAt = LocalDateTime.now();
        if (currentBuyCount == null) {
            currentBuyCount = 0;
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStockName() {
        return stockName;
    }

    public void setStockName(String stockName) {
        this.stockName = stockName;
    }

    public String getStockCode() {
        return stockCode;
    }

    public void setStockCode(String stockCode) {
        this.stockCode = stockCode;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public Integer getInvestPer() {
        return investPer;
    }

    public void setInvestPer(Integer investPer) {
        this.investPer = investPer;
    }

    public List<TradeParticipant> getParticipants() {
        return participants;
    }

    public void setParticipants(List<TradeParticipant> participants) {
        this.participants = participants;
    }

    // 편의 메서드: 참여자 추가
    public void addParticipant(User user) {
        TradeParticipant participant = new TradeParticipant();
        participant.setRealTrade(this);
        participant.setUser(user);
        participant.setJoinedAt(LocalDateTime.now());
        this.participants.add(participant);
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getAveragePrice() {
        return averagePrice;
    }

    public void setAveragePrice(Integer averagePrice) {
        this.averagePrice = averagePrice;
    }

    public Integer getCurrentBuyCount() {
        return currentBuyCount;
    }

    public void setCurrentBuyCount(Integer currentBuyCount) {
        this.currentBuyCount = currentBuyCount;
    }

    public Integer getTargetBuyCount() {
        return targetBuyCount;
    }

    public void setTargetBuyCount(Integer targetBuyCount) {
        this.targetBuyCount = targetBuyCount;
    }

    public Integer getCurrentPrice() {
        return currentPrice;
    }

    public void setCurrentPrice(Integer currentPrice) {
        this.currentPrice = currentPrice;
    }

    public Double getFinalReturnRate() {
        return finalReturnRate;
    }

    public void setFinalReturnRate(Double finalReturnRate) {
        this.finalReturnRate = finalReturnRate;
    }

    public Integer getFinalPeriod() {
        return finalPeriod;
    }

    public void setFinalPeriod(Integer finalPeriod) {
        this.finalPeriod = finalPeriod;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
}






