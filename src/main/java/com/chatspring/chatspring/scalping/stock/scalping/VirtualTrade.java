package com.chatspring.chatspring.scalping.stock.scalping;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "virtual_trades")
public class VirtualTrade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "trade_id")
    private Long tradeId;

    @Column(name = "stock_name", nullable = false)
    private String stockName;


    @Column(name = "stock_code", nullable = false)
    private String stockCode;

    @Column(name = "buy_price", nullable = false)
    private Integer buyPrice;

    @Column(name = "buy_time", nullable = false)
    private LocalDateTime buyTime;

    @Column(name = "num_buys", nullable = false)
    private Integer numBuys;

    @Column(name = "sell_price_1")
    private Integer sellPrice_1;

    @Column(name = "reach_time_1")
    private String reachTime_1;

    @Column(name = "sell_price_2")
    private Integer sellPrice_2;

    @Column(name = "reach_time_2")
    private String reachTime_2;

    @Column(name = "sell_price_3")
    private Integer sellPrice_3;

    @Column(name = "reach_time_3")
    private String reachTime_3;

    @Column(name = "stop_loss_price")
    private Integer stopLossPrice;

    @Column(name = "trade_result")
    private String tradeResult;

    @Column(name = "condition_type")
    private String conditionType;

    @Column(name = "market_type")
    private String marketType;

    @Column(name = "dead_zone")
    private Boolean deadZone;

    @Column(name = "original_stop_loss")
    private Integer originalStopLoss;

    @Column(name = "original_start_price")
    private Integer originalStartPrice;

    @Column(name = "final_profit")
    private Float finalProfit;

    @Column(name = "theme")
    private String theme;

    @Column(name = "volume_ratio")
    private Float volumeRatio;

    @Column(name = "min_price_10")
    private Integer minPrice10;

    @Column(name = "listing_date")
    private LocalDate listingDate;

    @Column(name = "songgot_date")
    private LocalDate songgotDate;

    @Column(name = "stock_warning")
    private String stockWarning;

    @Transient
    private Integer songgotCaptureCountIn90d; // 90일 내 송곳 포착 횟수를 담을 필드


//    @Column(name = "code")
//    private String Code;
//
//    public String getCode() {
//        return Code;
//    }
//
//    public void setCode(String Code) {
//        this.Code = Code;
//    }


//    @Column(name = "profit_reason")
//    private String profitReason;

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

    public Integer getBuyPrice() {
        return buyPrice;
    }

    public void setBuyPrice(Integer buyPrice) {
        this.buyPrice = buyPrice;
    }

    public LocalDateTime getBuyTime() {
        return buyTime;
    }

    public void setBuyTime(LocalDateTime buyTime) {
        this.buyTime = buyTime;
    }

    public Integer getNumBuys() {
        return numBuys;
    }

    public void setNumBuys(Integer numBuys) {
        this.numBuys = numBuys;
    }

    public Integer getSellPrice1() {
        return sellPrice_1;
    }

    public Integer getSellPrice2() {
        return sellPrice_2;
    }

    public Integer getSellPrice3() {
        return sellPrice_3;
    }

    public void setSellPrice1(Integer sellPrice_1) {
        this.sellPrice_1 = sellPrice_1;
    }

    public void setSellPrice2(Integer sellPrice_2) {
        this.sellPrice_2 = sellPrice_2;
    }

    public void setSellPrice3(Integer sellPrice_3) {
        this.sellPrice_3 = sellPrice_3;
    }

    public String getReachTime1() {
        return reachTime_1;
    }

    public void setReachTime1(String reachTime_1) {
        this.reachTime_1 = reachTime_1;
    }

    public String getReachTime2() {
        return reachTime_2;
    }

    public void setReachTime2(String reachTime_2) {
        this.reachTime_2 = reachTime_2;
    }

    public String getReachTime3() {
        return reachTime_3;
    }

    public void setReachTime3(String reachTime_3) {
        this.reachTime_3 = reachTime_3;
    }

    public Integer getstopLossPrice() {
        return stopLossPrice;
    }

    public void setstopLossPrice(Integer stopLossPrice) {
        this.stopLossPrice = stopLossPrice;
    }

    public String gettradeResult() {
        return tradeResult;
    }

    public void settradeResult(String tradeResult) {
        this.tradeResult = tradeResult;
    }

    public String getconditionType() {
        return conditionType;
    }

    public void setconditionType(String conditionType) {
        this.conditionType = conditionType;
    }

    public String getmarketType() {
        return marketType;
    }

    public void setmarketType(String marketType) {
        this.marketType = marketType;
    }

    public Integer getOriginalStopLoss() {
        return originalStopLoss;
    }

    public void setOriginalStopLoss(Integer originalStopLoss) {
        this.originalStopLoss = originalStopLoss;
    }

    public Integer getOriginalStartPrice() {
        return originalStartPrice;
    }

    public void setOriginalStartPrice(Integer originalStartPrice) {
        this.originalStartPrice = originalStartPrice;
    }


    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public Float getFinalProfit() {
        return finalProfit;
    }

    public void setFinalProfit(Float finalProfit) {
        this.finalProfit = finalProfit;
    }

    public Float getVolumeRatio() {
        return volumeRatio;
    }

    public void setVolumeRatio(Float volumeRatio) {
        this.volumeRatio = volumeRatio;
    }

    public Integer getMinPrice10() {
        return minPrice10;
    }

    public void setMinPrice10(Integer minPrice10) {
        this.minPrice10 = minPrice10;
    }

    public LocalDate getListingDate() {
        return listingDate;
    }

    public void setListingDate(LocalDate listingDate) {
        this.listingDate = listingDate;
    }

    public LocalDate getSonggotDate() {
        return songgotDate;
    }

    public void setSonggotDate(LocalDate songgotDate) {
        this.songgotDate = songgotDate;
    }

    public Integer getSonggotCaptureCountIn90d() {
        return songgotCaptureCountIn90d;
    }

    public void setSonggotCaptureCountIn90d(Integer songgotCaptureCountIn90d) {
        this.songgotCaptureCountIn90d = songgotCaptureCountIn90d;
    }

    public String getStockWarning() {
        return stockWarning;
    }

    public void setStockWarning(String stockWarning) {
        this.stockWarning = stockWarning;
    }
}

