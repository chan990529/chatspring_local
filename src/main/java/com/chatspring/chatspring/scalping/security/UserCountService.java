//package com.chatspring.chatspring.security;
//
//import org.springframework.stereotype.Service;
//
//import java.time.LocalDate;
//import java.util.concurrent.ConcurrentHashMap;
//
//@Service
//public class UserCountService {
//    private final ConcurrentHashMap<LocalDate, Integer> userCount = new ConcurrentHashMap<>();
//
//    // 접속자 수 증가
//    public void incrementUserCount() {
//        LocalDate today = LocalDate.now();
//        userCount.merge(today, 1, Integer::sum);
//    }
//
//    // 특정 날짜의 접속자 수 반환
//    public int getUserCount(LocalDate date) {
//        return userCount.getOrDefault(date, 0);
//    }
//}
