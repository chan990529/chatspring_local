package com.chatspring.chatspring.jugot;

import com.chatspring.chatspring.kiwoom.StockUpdateStatusService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

// 수정: CORS 설정은 전역 WebConfig 또는 @CrossOrigin으로 조정하세요.
@RestController
@RequestMapping("/api/jugot")
public class JugotController {

    private final JugotService service;
    private final RealTradeService realTradeService;
    private final StockUpdateStatusService stockUpdateStatusService;
    private final JugotRepository jugotRepository;

    public JugotController(JugotService service, RealTradeService realTradeService, StockUpdateStatusService stockUpdateStatusService, JugotRepository jugotRepository) {
        this.service = service;
        this.realTradeService = realTradeService;
        this.stockUpdateStatusService = stockUpdateStatusService;
        this.jugotRepository = jugotRepository;
    }

    // 수정: 실제 데이터 조회용 엔드포인트 (더미 제거)
    // 예) /api/jugot?year=2025&month=10&week=2
    @GetMapping
    public ResponseEntity<List<JugotDto>> getByWeek(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam int week
    ) {
        return ResponseEntity.ok(service.getByYearMonthWeek(year, month, week));
    }

    // 테스트용 간단한 엔드포인트
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("JugotController is working!");
    }

    // 주가 업데이트 상태 확인 API
    @GetMapping("/update-status")
    public ResponseEntity<Map<String, Object>> getUpdateStatus() {
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("isUpdating", stockUpdateStatusService.isUpdating());
        return ResponseEntity.ok(response);
    }

    // 모든 주차 데이터를 한 번에 가져오는 엔드포인트
    // 예) /api/jugot/all?year=2025&month=10
    @GetMapping("/all")
    public ResponseEntity<Map<String, List<JugotDto>>> getAllWeeks(
            @RequestParam int year,
            @RequestParam int month
    ) {
        return ResponseEntity.ok(service.getAllWeeksInMonth(year, month));
    }

    // 엑셀 파일 업로드 및 유효성 검증 엔드포인트
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadExcel(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "errors", List.of("파일이 비어있습니다.")));
            }

            Map<String, Object> result = service.uploadAndValidateExcel(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "errors", List.of("파일 업로드 중 오류: " + e.getMessage())));
        }
    }

    // 종목 검색 API (종목명으로 검색)
    @GetMapping("/stocks/search")
    public ResponseEntity<List<Map<String, Object>>> searchStocks(@RequestParam(required = false) String keyword) {
        try {
            List<Map<String, Object>> stocks;
            if (keyword != null && !keyword.trim().isEmpty()) {
                stocks = service.searchStocks(keyword.trim());
            } else {
                stocks = service.getRecentStocks();
            }
            return ResponseEntity.ok(stocks);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(List.of(Map.of("error", "종목 검색 중 오류: " + e.getMessage())));
        }
    }

    // 실매매 등록 API (Admin 전용)
    @PostMapping("/realtrade")
    public ResponseEntity<Map<String, Object>> createRealTrade(@RequestBody Map<String, Object> request) {
        try {
            RealTrade realTrade = new RealTrade();
            realTrade.setStockName((String) request.get("stockName"));
            realTrade.setStockCode((String) request.get("stockCode"));
            
            // 날짜 파싱
            String startDateStr = (String) request.get("startDate");
            if (startDateStr != null) {
                realTrade.setStartDate(java.time.LocalDate.parse(startDateStr));
            }
            
            // 인당 투자금액
            Object investPerObj = request.get("investPer");
            if (investPerObj instanceof Number) {
                realTrade.setInvestPer(((Number) investPerObj).intValue());
            } else if (investPerObj instanceof String) {
                realTrade.setInvestPer(Integer.parseInt((String) investPerObj));
            }
            
            // 참여자 명단은 더 이상 문자열로 저장하지 않음 (TradeParticipant 엔티티 사용)
            // 초기 참여자가 있다면 별도로 처리 필요 (현재는 제거)
            
            // 목표 매수 횟수 (선택사항)
            Object targetBuyCountObj = request.get("targetBuyCount");
            System.out.println("DEBUG: targetBuyCountObj = " + targetBuyCountObj + " (type: " + (targetBuyCountObj != null ? targetBuyCountObj.getClass().getName() : "null") + ")");
            if (targetBuyCountObj != null) {
                if (targetBuyCountObj instanceof Number) {
                    int value = ((Number) targetBuyCountObj).intValue();
                    System.out.println("DEBUG: Setting targetBuyCount to " + value);
                    realTrade.setTargetBuyCount(value);
                } else if (targetBuyCountObj instanceof String) {
                    String targetBuyCountStr = ((String) targetBuyCountObj).trim();
                    if (!targetBuyCountStr.isEmpty()) {
                        try {
                            int value = Integer.parseInt(targetBuyCountStr);
                            System.out.println("DEBUG: Setting targetBuyCount to " + value + " (from String)");
                            realTrade.setTargetBuyCount(value);
                        } catch (NumberFormatException e) {
                            System.err.println("DEBUG: Failed to parse targetBuyCount: " + targetBuyCountStr);
                        }
                    }
                }
            }
            System.out.println("DEBUG: Final realTrade.targetBuyCount = " + realTrade.getTargetBuyCount());
            
            // 상태 (기본값 ACTIVE)
            String status = (String) request.get("status");
            if (status != null && !status.isEmpty()) {
                realTrade.setStatus(status);
            }
            
            RealTrade saved = realTradeService.createRealTrade(realTrade);
            
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("message", "실매매 정보가 등록되었습니다.");
            response.put("id", saved.getId());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", "실매매 등록 중 오류: " + e.getMessage()));
        }
    }

    // 진행 중인 실매매 목록 조회
    @GetMapping("/realtrade/active")
    public ResponseEntity<List<RealTradeResponseDto>> getActiveRealTrades() {
        try {
            List<RealTrade> realTrades = realTradeService.getActiveRealTrades();
            List<RealTradeResponseDto> result = realTradeService.convertToDtoList(realTrades);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(List.of());
        }
    }

    // 모든 상태의 실매매 목록 조회 (ACTIVE, PAUSED, COMPLETED 포함)
    @GetMapping("/realtrade/all")
    public ResponseEntity<List<RealTradeResponseDto>> getAllRealTrades() {
        try {
            List<RealTrade> realTrades = realTradeService.getAllRealTrades();
            List<RealTradeResponseDto> result = realTradeService.convertToDtoList(realTrades);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(List.of());
        }
    }

    // 참여자 추가 API
    @PutMapping("/realtrade/{id}/join")
    public ResponseEntity<Map<String, Object>> joinRealTrade(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "error", "로그인이 필요합니다."));
            }
            
            String nickname = userPrincipal.getNickname();
            if (nickname == null || nickname.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false, "error", "유저 정보를 찾을 수 없습니다."));
            }
            
            // 참여자 추가
            RealTrade updated = realTradeService.addJoinMember(id, nickname);
            RealTradeResponseDto dto = realTradeService.convertToDto(updated);
            
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("message", "참여자 명단에 추가되었습니다.");
            response.put("participants", dto.getParticipants());
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "참여자 추가 중 오류가 발생했습니다."));
        }
    }

    // 참여자 나가기 API
    @PutMapping("/realtrade/{id}/leave")
    public ResponseEntity<Map<String, Object>> leaveRealTrade(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "error", "로그인이 필요합니다."));
            }
            
            String nickname = userPrincipal.getNickname();
            if (nickname == null || nickname.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false, "error", "유저 정보를 찾을 수 없습니다."));
            }
            
            // 서비스 호출: 참여자 제거
            RealTrade updated = realTradeService.removeJoinMember(id, nickname);
            RealTradeResponseDto dto = realTradeService.convertToDto(updated);
            
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("message", "참여가 취소되었습니다.");
            response.put("participants", dto.getParticipants());
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "참여 취소 중 오류가 발생했습니다."));
        }
    }

    // 실매매 삭제 API (Admin 전용)
    @DeleteMapping("/realtrade/{id}")
    public ResponseEntity<Map<String, Object>> deleteRealTrade(@PathVariable Long id) {
        try {
            realTradeService.deleteRealTrade(id);
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("message", "실매매 정보가 삭제되었습니다.");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "실매매 삭제 중 오류가 발생했습니다."));
        }
    }

    // 실매매 완료 처리 API (Admin 전용)
    @PutMapping("/realtrade/{id}/complete")
    public ResponseEntity<Map<String, Object>> completeRealTrade(@PathVariable Long id) {
        try {
            realTradeService.completeRealTrade(id);
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("message", "실매매 정보가 완료 처리되었습니다.");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "실매매 완료 처리 중 오류가 발생했습니다."));
        }
    }

    // 실매매 중단 처리 API (Admin 전용)
    @PutMapping("/realtrade/{id}/pause")
    public ResponseEntity<Map<String, Object>> pauseRealTrade(@PathVariable Long id) {
        try {
            realTradeService.pauseRealTrade(id);
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("message", "실매매 정보가 중단 처리되었습니다.");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "실매매 중단 처리 중 오류가 발생했습니다."));
        }
    }

    // 실매매 재개 처리 API (Admin 전용)
    @PutMapping("/realtrade/{id}/resume")
    public ResponseEntity<Map<String, Object>> resumeRealTrade(@PathVariable Long id) {
        try {
            realTradeService.resumeRealTrade(id);
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("message", "실매매 정보가 재개되었습니다.");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "실매매 재개 처리 중 오류가 발생했습니다."));
        }
    }

    // 관리자용 실매매 목록 조회 API (ACTIVE + PAUSED)
    @GetMapping("/realtrade/admin")
    public ResponseEntity<List<RealTradeResponseDto>> getRealTradesForAdmin() {
        try {
            List<RealTrade> realTrades = realTradeService.getRealTradesForAdmin();
            List<RealTradeResponseDto> result = realTradeService.convertToDtoList(realTrades);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(List.of());
        }
    }

    // [변경 시작] Personal Trade 기능: 참여자 목록 조회 API
    @GetMapping("/realtrade/participants")
    public ResponseEntity<List<ParticipantSummaryDto>> getAllRealTradeParticipants() {
        try {
            List<ParticipantSummaryDto> participants = realTradeService.getAllRealTradeParticipants();
            return ResponseEntity.ok(participants);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(List.of());
        }
    }

    // [변경 시작] Personal Trade 기능: 특정 참여자의 실매매 목록 조회 API (ACTIVE만)
    @GetMapping("/realtrade/participants/{name}/active")
    public ResponseEntity<List<RealTradeResponseDto>> getActiveRealTradesByParticipant(
            @PathVariable String name) {
        try {
            // URL 디코딩 처리
            String decodedName = java.net.URLDecoder.decode(name, java.nio.charset.StandardCharsets.UTF_8);
            
            List<RealTrade> realTrades = realTradeService.getActiveRealTradesByParticipant(decodedName);
            List<RealTradeResponseDto> result = realTradeService.convertToDtoList(realTrades);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(List.of());
        }
    }

    // [변경 시작] Personal Trade 기능: 특정 참여자의 모든 실매매 목록 조회 API (ACTIVE + COMPLETED)
    @GetMapping("/realtrade/participants/{name}/all")
    public ResponseEntity<List<RealTradeResponseDto>> getAllRealTradesByParticipant(
            @PathVariable String name) {
        try {
            // URL 디코딩 처리
            String decodedName = java.net.URLDecoder.decode(name, java.nio.charset.StandardCharsets.UTF_8);
            
            List<RealTrade> realTrades = realTradeService.getAllRealTradesByParticipant(decodedName);
            List<RealTradeResponseDto> result = realTradeService.convertToDtoList(realTrades);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(List.of());
        }
    }
    // [변경 끝]
}
