package com.chatspring.chatspring.scalping.stock.statistics;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "trade_statistics")
public class TradeStatistics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "total_trades", nullable = false)
    private Integer totalTrades;

    @Column(name = "total_wins", nullable = false)
    private Integer totalWins;

    @Column(name = "count_sell_price_1")
    private Integer countSellPrice1;

    @Column(name = "count_sell_price_2")
    private Integer countSellPrice2;

    @Column(name = "count_sell_price_3")
    private Integer countSellPrice3;

    @Column(name = "avg_reach_time")
    private String avgReachTime;

    @Column(name = "win_ratio_kospi")
    private Double winRatioKospi;

    @Column(name = "win_ratio_kosdaq")
    private Double winRatioKosdaq;

    @Column(name = "ratio_max_buy")
    private Double ratioMaxBuy;

    @Column(name = "win_ratio_morning")
    private Double winRatioMorning;

    @Column(name = "win_ratio_volume")
    private Double winRatioVolume;

    @Column(name = "count_stop_loss")
    private Integer countStopLoss;

    @Column(name = "win_ratio_am")
    private Double winRatioAM;

    @Column(name = "win_ratio_pm")
    private Double winRatioPM;

    @Column(name = "win_ratio_songgot")
    private Double winRatioSonggot;

    // 9시 통계
    @Column(name = "total_trades_h9")
    private Integer totalTradesH9;
    @Column(name = "win_trades_h9")
    private Integer winTradesH9;
    @Column(name = "win_rate_h9")
    private Double winRateH9;

    // 10시 통계
    @Column(name = "total_trades_h10")
    private Integer totalTradesH10;
    @Column(name = "win_trades_h10")
    private Integer winTradesH10;
    @Column(name = "win_rate_h10")
    private Double winRateH10;

    // 11시 통계
    @Column(name = "total_trades_h11")
    private Integer totalTradesH11;
    @Column(name = "win_trades_h11")
    private Integer winTradesH11;
    @Column(name = "win_rate_h11")
    private Double winRateH11;

    // 12시 통계
    @Column(name = "total_trades_h12")
    private Integer totalTradesH12;
    @Column(name = "win_trades_h12")
    private Integer winTradesH12;
    @Column(name = "win_rate_h12")
    private Double winRateH12;

    // 13시 통계
    @Column(name = "total_trades_h13")
    private Integer totalTradesH13;
    @Column(name = "win_trades_h13")
    private Integer winTradesH13;
    @Column(name = "win_rate_h13")
    private Double winRateH13;

    // 14시 통계
    @Column(name = "total_trades_h14")
    private Integer totalTradesH14;
    @Column(name = "win_trades_h14")
    private Integer winTradesH14;
    @Column(name = "win_rate_h14")
    private Double winRateH14;



    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Integer getTotalTrades() {
        return totalTrades;
    }

    public void setTotalTrades(Integer totalTrades) {
        this.totalTrades = totalTrades;
    }

    public Integer getTotalWins() {
        return totalWins;
    }

    public void setTotalWins(Integer totalWins) {
        this.totalWins = totalWins;
    }

    public Integer getCountSellPrice1() {
        return countSellPrice1;
    }

    public void setCountSellPrice1(Integer countSellPrice1) {
        this.countSellPrice1 = countSellPrice1;
    }

    public Integer getCountSellPrice2() {
        return countSellPrice2;
    }

    public void setCountSellPrice2(Integer countSellPrice2) {
        this.countSellPrice2 = countSellPrice2;
    }

    public Integer getCountSellPrice3() {
        return countSellPrice3;
    }

    public void setCountSellPrice3(Integer countSellPrice3) {
        this.countSellPrice3 = countSellPrice3;
    }

    public String getAvgReachTime() {return avgReachTime;
    }

    public void setAvgReachTime(String avgReachTime) {
        this.avgReachTime = avgReachTime;
    }

    public Double getWinRatioKospi() {
        return winRatioKospi;
    }

    public void setWinRatioKospi(Double winRatioKospi) {
        this.winRatioKospi = winRatioKospi;
    }

    public Double getWinRatioKosdaq() {
        return winRatioKosdaq;
    }

    public void setWinRatioKosdaq(Double winRatioKosdaq) {
        this.winRatioKosdaq = winRatioKosdaq;
    }

    public Double getRatioMaxBuy() {
        return ratioMaxBuy;
    }

    public void setRatioMaxBuy(Double ratioMaxBuy) {
        this.ratioMaxBuy = ratioMaxBuy;
    }

    public Double getWinRatioMorning() {
        return winRatioMorning;
    }

    public void setWinRatioMorning(Double winRatioMorning) {
        this.winRatioMorning = winRatioMorning;
    }

    public Double getWinRatioVolume() {
        return winRatioVolume;
    }

    public void setWinRatioVolume(Double winRatioVolume) {
        this.winRatioVolume = winRatioVolume;
    }

    public Integer getCountStopLoss() {
        return countStopLoss;
    }

    public void setCountStopLoss(Integer countStopLoss) {
        this.countStopLoss = countStopLoss;
    }

    public Double getWinRatioAM() {
        return winRatioAM;
    }

    public void setWinRatioAM(Double winRatioAM) {
        this.winRatioAM = winRatioAM;
    }

    public Double getWinRatioPM() {
        return winRatioPM;
    }

    public void setWinRatioPM(Double winRatioPM) {
        this.winRatioPM = winRatioPM;
    }


    public Double getWinRatioSonggot() {
        return winRatioSonggot;
    }

    public void setWinRatioSonggot(Double winRatioSonggot) {
        this.winRatioSonggot = winRatioSonggot;
    }

    // 9시 통계
    public Integer getTotalTradesH9() {
        return totalTradesH9;
    }

    public void setTotalTradesH9(Integer totalTradesH9) {
        this.totalTradesH9 = totalTradesH9;
    }

    public Integer getWinTradesH9() {
        return winTradesH9;
    }

    public void setWinTradesH9(Integer winTradesH9) {
        this.winTradesH9 = winTradesH9;
    }

    public Double getWinRateH9() {
        return winRateH9;
    }

    public void setWinRateH9(Double winRateH9) {
        this.winRateH9 = winRateH9;
    }

    // 10시 통계
    public Integer getTotalTradesH10() {
        return totalTradesH10;
    }

    public void setTotalTradesH10(Integer totalTradesH10) {
        this.totalTradesH10 = totalTradesH10;
    }

    public Integer getWinTradesH10() {
        return winTradesH10;
    }

    public void setWinTradesH10(Integer winTradesH10) {
        this.winTradesH10 = winTradesH10;
    }

    public Double getWinRateH10() {
        return winRateH10;
    }

    public void setWinRateH10(Double winRateH10) {
        this.winRateH10 = winRateH10;
    }

    // 11시 통계
    public Integer getTotalTradesH11() {
        return totalTradesH11;
    }

    public void setTotalTradesH11(Integer totalTradesH11) {
        this.totalTradesH11 = totalTradesH11;
    }

    public Integer getWinTradesH11() {
        return winTradesH11;
    }

    public void setWinTradesH11(Integer winTradesH11) {
        this.winTradesH11 = winTradesH11;
    }

    public Double getWinRateH11() {
        return winRateH11;
    }

    public void setWinRateH11(Double winRateH11) {
        this.winRateH11 = winRateH11;
    }

    // 12시 통계
    public Integer getTotalTradesH12() {
        return totalTradesH12;
    }

    public void setTotalTradesH12(Integer totalTradesH12) {
        this.totalTradesH12 = totalTradesH12;
    }

    public Integer getWinTradesH12() {
        return winTradesH12;
    }

    public void setWinTradesH12(Integer winTradesH12) {
        this.winTradesH12 = winTradesH12;
    }

    public Double getWinRateH12() {
        return winRateH12;
    }

    public void setWinRateH12(Double winRateH12) {
        this.winRateH12 = winRateH12;
    }

    // 13시 통계
    public Integer getTotalTradesH13() {
        return totalTradesH13;
    }

    public void setTotalTradesH13(Integer totalTradesH13) {
        this.totalTradesH13 = totalTradesH13;
    }

    public Integer getWinTradesH13() {
        return winTradesH13;
    }

    public void setWinTradesH13(Integer winTradesH13) {
        this.winTradesH13 = winTradesH13;
    }

    public Double getWinRateH13() {
        return winRateH13;
    }

    public void setWinRateH13(Double winRateH13) {
        this.winRateH13 = winRateH13;
    }

    // 14시 통계
    public Integer getTotalTradesH14() {
        return totalTradesH14;
    }

    public void setTotalTradesH14(Integer totalTradesH14) {
        this.totalTradesH14 = totalTradesH14;
    }

    public Integer getWinTradesH14() {
        return winTradesH14;
    }

    public void setWinTradesH14(Integer winTradesH14) {
        this.winTradesH14 = winTradesH14;
    }

    public Double getWinRateH14() {
        return winRateH14;
    }

    public void setWinRateH14(Double winRateH14) {
        this.winRateH14 = winRateH14;
    }




}