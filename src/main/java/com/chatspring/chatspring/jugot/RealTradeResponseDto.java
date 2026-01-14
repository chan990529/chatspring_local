package com.chatspring.chatspring.jugot;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class RealTradeResponseDto {
    private Long id;
    private String stockName;
    private String stockCode;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer investPer;
    private List<ParticipantDto> participants;
    private String status;
    private LocalDateTime createdAt;
    private Integer averagePrice;
    private Integer currentBuyCount;
    private Integer targetBuyCount;
    private Integer currentPrice;
    private Integer buyPrice;
    private Integer startPrice;
    private Double finalReturnRate;
    private Integer finalPeriod;

    public RealTradeResponseDto() {}

    @JsonProperty("id")
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @JsonProperty("stockName")
    public String getStockName() {
        return stockName;
    }

    public void setStockName(String stockName) {
        this.stockName = stockName;
    }

    @JsonProperty("stockCode")
    public String getStockCode() {
        return stockCode;
    }

    public void setStockCode(String stockCode) {
        this.stockCode = stockCode;
    }

    @JsonProperty("startDate")
    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    @JsonProperty("endDate")
    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    @JsonProperty("investPer")
    public Integer getInvestPer() {
        return investPer;
    }

    public void setInvestPer(Integer investPer) {
        this.investPer = investPer;
    }

    @JsonProperty("participants")
    public List<ParticipantDto> getParticipants() {
        return participants;
    }

    public void setParticipants(List<ParticipantDto> participants) {
        this.participants = participants;
    }

    @JsonProperty("status")
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @JsonProperty("createdAt")
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @JsonProperty("averagePrice")
    public Integer getAveragePrice() {
        return averagePrice;
    }

    public void setAveragePrice(Integer averagePrice) {
        this.averagePrice = averagePrice;
    }

    @JsonProperty("currentBuyCount")
    public Integer getCurrentBuyCount() {
        return currentBuyCount;
    }

    public void setCurrentBuyCount(Integer currentBuyCount) {
        this.currentBuyCount = currentBuyCount;
    }

    @JsonProperty("targetBuyCount")
    public Integer getTargetBuyCount() {
        return targetBuyCount;
    }

    public void setTargetBuyCount(Integer targetBuyCount) {
        this.targetBuyCount = targetBuyCount;
    }

    @JsonProperty("currentPrice")
    public Integer getCurrentPrice() {
        return currentPrice;
    }

    public void setCurrentPrice(Integer currentPrice) {
        this.currentPrice = currentPrice;
    }

    @JsonProperty("buyPrice")
    public Integer getBuyPrice() {
        return buyPrice;
    }

    public void setBuyPrice(Integer buyPrice) {
        this.buyPrice = buyPrice;
    }

    @JsonProperty("startPrice")
    public Integer getStartPrice() {
        return startPrice;
    }

    public void setStartPrice(Integer startPrice) {
        this.startPrice = startPrice;
    }

    @JsonProperty("finalReturnRate")
    public Double getFinalReturnRate() {
        return finalReturnRate;
    }

    public void setFinalReturnRate(Double finalReturnRate) {
        this.finalReturnRate = finalReturnRate;
    }

    @JsonProperty("finalPeriod")
    public Integer getFinalPeriod() {
        return finalPeriod;
    }

    public void setFinalPeriod(Integer finalPeriod) {
        this.finalPeriod = finalPeriod;
    }
}
