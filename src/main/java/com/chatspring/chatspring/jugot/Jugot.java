package com.chatspring.chatspring.jugot;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "jugots", indexes = {
    @Index(name = "idx_capture_date", columnList = "capture_date"),
    @Index(name = "idx_stock_name_date", columnList = "stock_name, capture_date")
})
public class Jugot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "trade_id")
    private Long tradeId;

    @Column(name = "stock_name", nullable = false)
    private String stockName;

    @Column(name = "stock_code", nullable = false)
    private String stockCode;

    @Column(name = "capture_price", nullable = false)
    private Integer capturePrice;

    @Column(name = "capture_date", nullable = false)
    private LocalDate captureDate;

    @Column(name = "market_type")
    private String marketType;

    @Column(name = "current_price")
    private Integer currentPrice;

    @Column(name = "highest_price")
    private Integer highestPrice;

    @Column(name = "lowest_price")
    private Integer lowestPrice;




    // Getters and Setters
    public Long getTradeId() {
        return tradeId;
    }

    public void setTradeId(Long tradeId) {
        this.tradeId = tradeId;
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


    public String getMarketType() {
        return marketType;
    }

    public void setMarketType(String marketType) {
        this.marketType = marketType;
    }


    public LocalDate getCaptureDate() {
        return captureDate;
    }

    public void setCaptureDate(LocalDate captureDate) {
        this.captureDate = captureDate;
    }

    public Integer getCapturePrice() {
        return capturePrice;
    }

    public void setCapturePrice(Integer capturePrice) {
        this.capturePrice = capturePrice;
    }

    public Integer getCurrentPrice() {
        return currentPrice;
    }

    public void setCurrentPrice(Integer currentPrice) {
        this.currentPrice = currentPrice;
    }

    public Integer getHighestPrice() {
        return highestPrice;
    }

    public void setHighestPrice(Integer highestPrice) {
        this.highestPrice = highestPrice;
    }

    public Integer getLowestPrice() {
        return lowestPrice;
    }

    public void setLowestPrice(Integer lowestPrice) {
        this.lowestPrice = lowestPrice;
    }
}

