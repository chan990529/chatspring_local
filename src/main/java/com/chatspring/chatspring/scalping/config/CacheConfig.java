package com.chatspring.chatspring.scalping.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching // 캐싱 기능을 활성화합니다.
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("dailyStockData"); // 캐시 이름 정의
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(10, TimeUnit.HOURS) // 데이터는 10시간 동안 캐시됩니다.
                .maximumSize(500) // 최대 500개의 종목 데이터를 캐시합니다.
        );
        return cacheManager;
    }
}