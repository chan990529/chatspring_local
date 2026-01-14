package com.chatspring.chatspring.scalping.stock;

import com.chatspring.chatspring.scalping.stock.dto.DailyCandleDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class StockDataService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final CacheManager cacheManager; // CacheManager 주입

    // 생성자를 통해 CacheManager를 주입받음
    public StockDataService(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    // 'dailyStockData' 캐시에 stockCode를 키로 하여 결과를 저장합니다.
    // 이미 캐시에 데이터가 있으면 메소드를 실행하지 않고 즉시 캐시된 값을 반환합니다.
    @Cacheable(value = "dailyStockData", key = "#stockCode")
    public List<DailyCandleDto> getDailyDataFromPython(String stockCode) throws IOException, InterruptedException {
        System.out.println("Cache miss! Fetching data from Python script for stock code: " + stockCode);

        // 이전 답변에서 사용한 파이썬 스크립트 실행 로직
        ProcessBuilder processBuilder = new ProcessBuilder("python3", "path/to/get_daily_data.py", stockCode);
        processBuilder.redirectErrorStream(true);

        Process process = processBuilder.start();
        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));

        StringBuilder output = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            output.append(line);
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("Python script execution failed for stock code: " + stockCode);
        }

        // 파이썬이 출력한 JSON을 Map<String, DTO> 형태로 파싱
        Map<String, DailyCandleDto> dailyDataMap = objectMapper.readValue(
                output.toString(),
                new TypeReference<Map<String, DailyCandleDto>>() {}
        );

        // 프론트엔드에서 사용하기 쉽게 List<DTO> 형태로 변환
        List<DailyCandleDto> candleList = new ArrayList<>();
        dailyDataMap.forEach((date, candle) -> {
            candle.setDate(date); // 날짜 필드 설정
            candleList.add(candle);
        });

        // 날짜 순으로 정렬
        candleList.sort((c1, c2) -> c1.getDate().compareTo(c2.getDate()));

        return candleList;
    }

    // [새로 추가할 코드] 데이터를 직접 캐시에 저장하는 메소드
    public void cacheDailyData(String stockCode, List<DailyCandleDto> candles) {
        // "dailyStockData"라는 이름의 캐시를 가져옴
        Cache dailyDataCache = cacheManager.getCache("dailyStockData");

        if (dailyDataCache != null) {
            // 캐시에 stockCode를 키로, candle 리스트를 값으로 저장
            dailyDataCache.put(stockCode, candles);
            System.out.println("Successfully cached " + candles.size() + " daily candles for stock code: " + stockCode);
        } else {
            throw new RuntimeException("Cache 'dailyStockData' not found.");
        }
    }
}