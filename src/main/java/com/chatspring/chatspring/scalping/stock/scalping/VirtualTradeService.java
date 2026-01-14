package com.chatspring.chatspring.scalping.stock.scalping;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class VirtualTradeService {

    @Autowired
    private VirtualTradeRepository virtualTradeRepository;

    public List<VirtualTrade> findAll() {
        List<VirtualTrade> trades = virtualTradeRepository.findAll();
        populateSonggotCaptureCounts(trades); // 헬퍼 메서드 호출
        return trades;
    }

    public VirtualTrade findById(Long id) {
        return virtualTradeRepository.findById(id).orElse(null);
    }

    public VirtualTrade save(VirtualTrade trade) {
        return virtualTradeRepository.save(trade);
    }

    public void delete(Long id) {
        virtualTradeRepository.deleteById(id);
    }

    public List<VirtualTrade> findByStockCode(String stockCode) {
        return virtualTradeRepository.findByStockCodeContainingIgnoreCase(stockCode);
    }

    public List<VirtualTrade> findByStockCode_today(String stockCode) {
        ZoneId seoulZoneId = ZoneId.of("Asia/Seoul");
        LocalDate today = LocalDate.now(seoulZoneId);
        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime endOfToday = today.atTime(23, 59, 59);

        // 조회 후, populate 메소드를 호출하여 값을 채워줍니다.
        List<VirtualTrade> trades = virtualTradeRepository.findByStockCodeContainingIgnoreCaseAndBuyTimeBetween(stockCode, startOfToday, endOfToday);
        populateSonggotCaptureCounts(trades); // <<-- 이 라인을 추가하세요.
        return trades;
    }

    public List<VirtualTrade> findByStockName(String stockName) {
        List<VirtualTrade> trades = virtualTradeRepository.findByStockNameContainingIgnoreCase(stockName);
        populateSonggotCaptureCounts(trades); // 헬퍼 메서드 호출
        return trades;
    }

    public List<VirtualTrade> findByStockNameExact(String stockName) {
        // 조회 후, populate 메소드를 호출하여 값을 채워줍니다.
        List<VirtualTrade> trades = virtualTradeRepository.findByStockName(stockName);
        populateSonggotCaptureCounts(trades); // <<-- 이 라인을 추가하세요.
        return trades;
    }

    public List<VirtualTrade> findByBuyTimeBetween(LocalDateTime startDate, LocalDateTime endDate) {
        // 조회 후, populate 메소드를 호출하여 값을 채워줍니다.
        List<VirtualTrade> trades = virtualTradeRepository.findByBuyTimeBetween(startDate, endDate);
        populateSonggotCaptureCounts(trades); // <<-- 이 라인을 추가하세요.
        return trades;
    }
    
    // 자동완성을 위한 종목명 검색 메소드
    public List<String> findStockNamesByQuery(String query) {
        Pageable pageable = PageRequest.of(0, 5, Sort.by("stockName").ascending());
        return virtualTradeRepository.findStockNamesByQuery(query, pageable);
    }

    /**
     * [추가] 거래 목록에 대해 90일 내 총 포착 횟수를 계산하여 채워주는 헬퍼 메서드
     * @param trades 포착 횟수를 채워 넣을 VirtualTrade 목록
     */
    private void populateSonggotCaptureCounts(List<VirtualTrade> trades) {
        if (trades == null || trades.isEmpty()) {
            return;
        }

        // songgotDate가 있는 거래들의 종목명만 중복 없이 추출
        List<String> songgotStockNames = trades.stream()
                .filter(trade -> trade.getSonggotDate() != null)
                .map(VirtualTrade::getStockName)
                .distinct()
                .collect(Collectors.toList());

        if (songgotStockNames.isEmpty()) {
            return;
        }

        LocalDateTime ninetyDaysAgo = LocalDateTime.now().minusDays(90);

        // DB에서 종목별 90일 내 포착 횟수를 한 번에 조회
        List<SonggotCaptureCountDto> counts = virtualTradeRepository.countTotalCapturesInLast90Days(songgotStockNames, ninetyDaysAgo);

        // 빠른 조회를 위해 Map으로 변환 (Key: stockName, Value: count)
        Map<String, Long> countMap = counts.stream()
                .collect(Collectors.toMap(SonggotCaptureCountDto::getStockName, SonggotCaptureCountDto::getCount));

        // 각 거래에 대해 계산된 횟수를 설정
        for (VirtualTrade trade : trades) {
            if (trade.getSonggotDate() != null) {
                // getOrDefault: 맵에 키가 없으면 기본값(0L) 반환
                Integer count = countMap.getOrDefault(trade.getStockName(), 0L).intValue();
                trade.setSonggotCaptureCountIn90d(count);
            }
        }
    }


}

