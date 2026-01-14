package com.chatspring.chatspring.scalping.stock;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;

@RestController
public class ServerTimeController {

    @GetMapping("/api/server-time")
    public ResponseEntity<Map<String, String>> getServerTime() {
        Map<String, String> response = new HashMap<>();
        // 서버 로컬 타임존(Asia/Seoul)을 기준으로 ISO 문자열 반환
        String seoulTimeIso = OffsetDateTime.now(ZoneId.of("Asia/Seoul")).toString();
        response.put("serverTime", seoulTimeIso);
        return ResponseEntity.ok(response);
    }
}