package com.chatspring.chatspring.jugot;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;

// 수정: 엔티티를 직접 노출하지 않도록 DTO 추가
public class JugotDto {
    private String name;      // 종목명
    private Integer capturePrice;  // 포착가
    private LocalDate captureDate;
    private String marketType;
    private Integer currentPrice;   // 현재가
    private Integer highestPrice;   // 최고가
    private Integer lowestPrice;    // 최저가

    public JugotDto() {}

    public JugotDto(String name, Integer capturePrice, LocalDate captureDate, String marketType, Integer currentPrice, Integer highestPrice, Integer lowestPrice) {
        this.name = name;
        this.capturePrice = capturePrice;
        this.captureDate = captureDate;
        this.marketType = marketType;
        this.currentPrice = currentPrice;
        this.highestPrice = highestPrice;
        this.lowestPrice = lowestPrice;
    }

    // getters/setters with JSON property names
    @JsonProperty("name")
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    @JsonProperty("capturePrice")
    public Integer getCapturePrice() { return capturePrice; }
    public void setCapturePrice(Integer capturePrice) { this.capturePrice = capturePrice; }

    @JsonProperty("captureDate")
    public LocalDate getCaptureDate() { return captureDate; }
    public void setCaptureDate(LocalDate captureDate) { this.captureDate = captureDate; }

    @JsonProperty("marketType")
    public String getMarketType() {
        return marketType;
    }

    public void setMarketType(String marketType) {
        this.marketType = marketType;
    }

    @JsonProperty("currentPrice")
    public Integer getCurrentPrice() {
        return currentPrice;
    }

    public void setCurrentPrice(Integer currentPrice) {
        this.currentPrice = currentPrice;
    }

    @JsonProperty("highestPrice")
    public Integer getHighestPrice() {
        return highestPrice;
    }

    public void setHighestPrice(Integer highestPrice) {
        this.highestPrice = highestPrice;
    }

    @JsonProperty("lowestPrice")
    public Integer getLowestPrice() {
        return lowestPrice;
    }

    public void setLowestPrice(Integer lowestPrice) {
        this.lowestPrice = lowestPrice;
    }
}
