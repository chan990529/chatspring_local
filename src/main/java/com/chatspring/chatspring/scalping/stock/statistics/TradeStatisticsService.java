package com.chatspring.chatspring.scalping.stock.statistics;

import com.chatspring.chatspring.scalping.stock.scalping.VirtualTrade;
import com.chatspring.chatspring.scalping.stock.scalping.VirtualTradeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Collections;
import java.time.*;
import java.util.*;

@Service
public class TradeStatisticsService {

    @Autowired
    private TradeStatisticsRepository tradeStatisticsRepository;

    // 이미 구현된 VirtualTradeRepository 사용
    @Autowired
    private VirtualTradeRepository virtualTradeRepository;

    public void saveStatistics(Map<String, Object> statistics) {
        TradeStatistics tradeStatistics = new TradeStatistics();
        tradeStatistics.setDate(LocalDate.parse(statistics.get("date").toString()));
        tradeStatistics.setTotalTrades((Integer) statistics.get("total_trades"));
        tradeStatistics.setTotalWins((Integer) statistics.get("total_wins"));
        tradeStatistics.setCountSellPrice1((Integer) statistics.get("count_sell_price_1"));
        tradeStatistics.setCountSellPrice2((Integer) statistics.get("count_sell_price_2"));
        tradeStatistics.setCountSellPrice3((Integer) statistics.get("count_sell_price_3"));
        tradeStatistics.setAvgReachTime((String) statistics.get("avg_reach_time"));
        tradeStatistics.setWinRatioKospi(Double.valueOf(statistics.get("win_ratio_kospi").toString()));
        tradeStatistics.setWinRatioKosdaq(Double.valueOf(statistics.get("win_ratio_kosdaq").toString()));
        tradeStatistics.setRatioMaxBuy(Double.valueOf(statistics.get("ratio_max_buy").toString()));
        // 복어 승률는 기존 필드 win_ratio_morning에 저장 (DB값 그대로 사용)
        tradeStatistics.setWinRatioMorning(Double.valueOf(statistics.get("win_ratio_morning").toString()));
        tradeStatistics.setWinRatioVolume(Double.valueOf(statistics.get("win_ratio_volume").toString()));
        tradeStatistics.setCountStopLoss((Integer) statistics.get("count_stop_loss"));
        tradeStatistics.setWinRatioSonggot(Double.valueOf(statistics.get("win_ratio_songgot").toString()));
        tradeStatisticsRepository.save(tradeStatistics);
    }

    public Map<String, Object> getStatisticsForDate(LocalDate date) {
        TradeStatistics stats = tradeStatisticsRepository.findByDate(date);

        if (stats != null) {
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("date", stats.getDate());
            statistics.put("total_trades", stats.getTotalTrades());
            statistics.put("count_sell_price_1", stats.getCountSellPrice1());
            statistics.put("count_sell_price_2", stats.getCountSellPrice2());
            statistics.put("count_sell_price_3", stats.getCountSellPrice3());
            statistics.put("total_wins", stats.getTotalWins());
            statistics.put("avg_reach_time", stats.getAvgReachTime());
            statistics.put("win_ratio_kospi", stats.getWinRatioKospi());
            statistics.put("win_ratio_kosdaq", stats.getWinRatioKosdaq());
            statistics.put("ratio_max_buy", stats.getRatioMaxBuy());
            // 복어 승률은 DB의 win_ratio_morning 값을 그대로 사용
            statistics.put("win_ratio_morning", stats.getWinRatioMorning());
            statistics.put("win_ratio_volume", stats.getWinRatioVolume());
            statistics.put("count_stop_loss", stats.getCountStopLoss());
            statistics.put("win_ratio_songgot", stats.getWinRatioSonggot());

            // --- ▼▼▼▼▼▼ 여기부터 시간대별 통계 데이터를 추가합니다 ▼▼▼▼▼▼ ---
            for (int hour = 9; hour <= 14; hour++) {
                // Java 리플렉션을 사용하여 동적으로 getter 호출 (코드를 간결하게 유지)
                try {
                    statistics.put("total_trades_h" + hour, TradeStatistics.class.getMethod("getTotalTradesH" + hour).invoke(stats));
                    statistics.put("win_trades_h" + hour, TradeStatistics.class.getMethod("getWinTradesH" + hour).invoke(stats));
                    statistics.put("win_rate_h" + hour, TradeStatistics.class.getMethod("getWinRateH" + hour).invoke(stats));
                } catch (Exception e) {
                    // 예외 처리 (실제 프로덕션 코드에서는 로깅을 추가하는 것이 좋습니다)
                    e.printStackTrace();
                }
            }
            // --- ▲▲▲▲▲▲ 여기까지 추가 ▲▲▲▲▲▲ ---


            return statistics;
        } else {
            throw new RuntimeException("No statistics available for this day.");
        }
    }

    public Map<String, Object> getStatisticsForToday() {
        LocalDate today = LocalDate.now();
        TradeStatistics stats = tradeStatisticsRepository.findByDate(today);

        if (stats != null) {
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("date", stats.getDate());
            statistics.put("total_trades", stats.getTotalTrades());
            statistics.put("count_sell_price_1", stats.getCountSellPrice1());
            statistics.put("count_sell_price_2", stats.getCountSellPrice2());
            statistics.put("count_sell_price_3", stats.getCountSellPrice3());
            statistics.put("total_wins", stats.getTotalWins());
            statistics.put("avg_reach_time", stats.getAvgReachTime());
            statistics.put("win_ratio_kospi", stats.getWinRatioKospi());
            statistics.put("win_ratio_kosdaq", stats.getWinRatioKosdaq());
            statistics.put("ratio_max_buy", stats.getRatioMaxBuy());
            // 복어 승률: DB에 저장된 win_ratio_morning 값 그대로 사용
            statistics.put("win_ratio_morning", stats.getWinRatioMorning());
            statistics.put("win_ratio_volume", stats.getWinRatioVolume());
            statistics.put("count_stop_loss", stats.getCountStopLoss());
            statistics.put("win_ratio_songgot", stats.getWinRatioSonggot());

            for (int hour = 9; hour <= 14; hour++) {
                // Java 리플렉션을 사용하여 동적으로 getter 호출 (코드를 간결하게 유지)
                try {
                    statistics.put("total_trades_h" + hour, TradeStatistics.class.getMethod("getTotalTradesH" + hour).invoke(stats));
                    statistics.put("win_trades_h" + hour, TradeStatistics.class.getMethod("getWinTradesH" + hour).invoke(stats));
                    statistics.put("win_rate_h" + hour, TradeStatistics.class.getMethod("getWinRateH" + hour).invoke(stats));
                } catch (Exception e) {
                    // 예외 처리 (실제 프로덕션 코드에서는 로깅을 추가하는 것이 좋습니다)
                    e.printStackTrace();
                }
            }

            return statistics;
        } else {
            throw new RuntimeException("No statistics available for today.");
        }
    }

    public List<Map<String, Object>> getStatisticsHistory(int days, LocalDate baseDate) {
        List<Map<String, Object>> history = new ArrayList<>();
        LocalDate date = baseDate;
        // 실제 거래가 있었던 날이 days 만큼 수집될 때까지 반복
        while (history.size() < days) {
            TradeStatistics stats = tradeStatisticsRepository.findByDate(date);
            if (stats != null && stats.getTotalTrades() > 0) {
                Map<String, Object> historyItem = new HashMap<>();
                historyItem.put("date", date.toString());
                double winRatio = ((double) stats.getTotalWins() / stats.getTotalTrades()) * 100;
                historyItem.put("win_ratio", winRatio);
                history.add(historyItem);
            }
            // 이전 날짜로 이동
            date = date.minusDays(1);
        }
        // 리스트를 역순으로 뒤집어 오래된 날짜부터 최신 날짜 순으로 정렬
        Collections.reverse(history);
        return history;
    }

    // VirtualTrade 데이터를 기반으로 오전/오후 승률 계산 메서드
    public Map<String, Double> calculateTimeBasedWinRatios(LocalDate date) {
        LocalTime morningStart = LocalTime.of(9, 20);
        LocalTime morningEnd = LocalTime.of(12, 0);
        LocalTime afternoonStart = LocalTime.of(13, 0);
        LocalTime afternoonEnd = LocalTime.of(15, 10);

        LocalDateTime startDateTime = date.atStartOfDay();
        LocalDateTime endDateTime = date.plusDays(1).atStartOfDay();
        List<VirtualTrade> trades = virtualTradeRepository.findByBuyTimeBetween(startDateTime, endDateTime);

        int totalAm = 0, totalPm = 0;
        int winAm = 0, winPm = 0;

        // 각 거래의 buyTime을 기준으로 오전/오후 분류
        for (VirtualTrade trade : trades) {
            LocalTime buyTimeLocal = trade.getBuyTime().toLocalTime();
            if (!buyTimeLocal.isBefore(morningStart) && !buyTimeLocal.isAfter(morningEnd)) {
                totalAm++;
                if ("승리".equals(trade.gettradeResult().trim())) {
                    winAm++;
                }
            } else if (!buyTimeLocal.isBefore(afternoonStart) && !buyTimeLocal.isAfter(afternoonEnd)) {
                totalPm++;
                if ("승리".equals(trade.gettradeResult().trim())) {
                    winPm++;
                }
            }
        }

        double winRatioAm = totalAm > 0 ? ((double) winAm / totalAm) * 100 : 0;
        double winRatioPm = totalPm > 0 ? ((double) winPm / totalPm) * 100 : 0;

        Map<String, Double> ratios = new HashMap<>();
        ratios.put("win_ratio_am", winRatioAm);
        ratios.put("win_ratio_pm", winRatioPm);
        return ratios;
    }







}