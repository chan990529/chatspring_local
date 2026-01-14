package com.chatspring.chatspring.scalping.stock;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class StockCapture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String stockName;
    private LocalDate captureDate;
    private BigDecimal capturePrice;

    // 기본 생성자, getter, setter
    public StockCapture() {}

    public StockCapture(String stockName, LocalDate captureDate, BigDecimal capturePrice) {
        this.stockName = stockName;
        this.captureDate = captureDate;
        this.capturePrice = capturePrice;
    }

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

    public LocalDate getCaptureDate() {
        return captureDate;
    }

    public void setCaptureDate(LocalDate captureDate) {
        this.captureDate = captureDate;
    }

    public BigDecimal getCapturePrice() {
        return capturePrice;
    }

    public void setCapturePrice(BigDecimal capturePrice) {
        this.capturePrice = capturePrice;
    }
}
