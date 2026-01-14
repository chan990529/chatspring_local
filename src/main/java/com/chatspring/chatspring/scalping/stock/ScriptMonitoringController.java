package com.chatspring.chatspring.scalping.stock;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/monitoring")
public class ScriptMonitoringController {

    private final Map<String, Object> scriptStatus = new HashMap<>();


    public ScriptMonitoringController() {
        // 초기 상태 설정
        scriptStatus.put("status", "Not Running");
        scriptStatus.put("lastUpdateTime", null);
        scriptStatus.put("error", null);
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getScriptStatus() {
        return new ResponseEntity<>(scriptStatus, HttpStatus.OK);
    }

    @PostMapping("/update-status")
    public ResponseEntity<Void> updateScriptStatus(@RequestBody Map<String, Object> statusUpdate) {
        scriptStatus.put("status", statusUpdate.getOrDefault("status", "Unknown"));
        scriptStatus.put("lastUpdateTime", statusUpdate.getOrDefault("lastUpdateTime", null));
        scriptStatus.put("error", statusUpdate.getOrDefault("error", null));
        scriptStatus.put("details", statusUpdate.getOrDefault("details", null));
        return new ResponseEntity<>(HttpStatus.OK);
    }
}

// 간단한 설명:
// - '/status' GET 요청을 통해 스크립트의 현재 상태를 조회할 수 있습니다.
// - '/update-status' POST 요청을 통해 Python 스크립트가 자신의 상태를 업데이트할 수 있습니다.
//   - Python 스크립트는 상태가 변경될 때마다 이 엔드포인트로 요청을 보내 상태를 전달해야 합니다.
