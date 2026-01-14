package com.chatspring.chatspring.scalping.stock.scalping;

// 이 DTO는 Repository 쿼리 결과를 담는 용도입니다.
public class SonggotCaptureCountDto {
    private String stockName;
    private long count;

    public SonggotCaptureCountDto(String stockName, long count) {
        this.stockName = stockName;
        this.count = count;
    }

    // Getters
    public String getStockName() {
        return stockName;
    }

    public long getCount() {
        return count;
    }
}