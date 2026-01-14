package com.chatspring.chatspring.jugot.user;

import com.chatspring.chatspring.jugot.UserPrincipal;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    private static final String SECRET_KEY = "MAKEMONEYWITHCHIMAN000";

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRegisterDto dto) {
        try {
            User user = new User();
            user.setUsername(dto.getUsername());
            user.setPassword(dto.getPassword());
            user.setNickname(dto.getNickname());

            User savedUser = userService.register(user);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "회원가입이 완료되었습니다.");
            response.put("username", savedUser.getUsername());
            response.put("nickname", savedUser.getNickname());

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            // 닉네임 중복인 경우 명확한 에러 코드 제공
            if (e.getMessage().contains("닉네임")) {
                response.put("errorCode", "NICKNAME_DUPLICATE");
            } else if (e.getMessage().contains("아이디")) {
                response.put("errorCode", "USERNAME_DUPLICATE");
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "회원가입 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserLoginDto dto, HttpServletResponse response) {
        try {
            User user = userService.login(dto.getUsername(), dto.getPassword());

            // JWT 토큰 생성
            long expirationTime = 60 * 60 * 1000; // 24시간
            Date now = new Date();
            Date expiryDate = new Date(now.getTime() + expirationTime);

            String token = Jwts.builder()
                    .setSubject(user.getUsername())
                    .claim("nickname", user.getNickname())
                    .claim("id", user.getId())
                    .claim("role", user.getRole())
                    .setIssuedAt(now)
                    .setExpiration(expiryDate)
                    .signWith(SignatureAlgorithm.HS256, SECRET_KEY.getBytes())
                    .compact();

            ResponseCookie cookie = ResponseCookie.from("authToken", token)
                    .httpOnly(true)
                    .path("/")
                    .maxAge(expirationTime / 1000)
                    .build();
            response.setHeader("Set-Cookie", cookie.toString());

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("success", true);
            responseBody.put("token", token);
            responseBody.put("username", user.getUsername());
            responseBody.put("nickname", user.getNickname());
            responseBody.put("role", user.getRole());

            return ResponseEntity.ok(responseBody);
        } catch (RuntimeException e) {
            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("success", false);
            responseBody.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(responseBody);
        } catch (Exception e) {
            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("success", false);
            responseBody.put("error", "로그인 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseBody);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("auth", false));
        }
        
        User user = userService.findById(userPrincipal.getId());
        
        Map<String, Object> response = new HashMap<>();
        response.put("auth", true);
        response.put("username", userPrincipal.getUsername());
        response.put("nickname", user.getNickname());
        response.put("requestedNickname", user.getRequestedNickname());
        response.put("introductionLink", user.getIntroductionLink());
        response.put("id", userPrincipal.getId());
        response.put("role", userPrincipal.getRole());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateUserInfo(
            @RequestBody UserInfoUpdateDto dto,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "error", "인증이 필요합니다."));
            }

            User updatedUser = userService.updateUserInfo(userPrincipal.getId(), dto);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "회원 정보가 수정되었습니다.");
            response.put("introductionLink", updatedUser.getIntroductionLink());
            response.put("requestedNickname", updatedUser.getRequestedNickname());
            if (updatedUser.getRequestedNickname() != null) {
                response.put("message", "닉네임 변경 요청이 접수되었습니다. 관리자 승인을 기다려주세요.");
            }

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            if (e.getMessage().contains("닉네임")) {
                response.put("errorCode", "NICKNAME_DUPLICATE");
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "회원 정보 수정 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PutMapping("/me/password")
    public ResponseEntity<?> changePassword(
            @RequestBody PasswordChangeDto dto,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "error", "인증이 필요합니다."));
            }

            // 입력값 검증
            if (dto.getCurrentPassword() == null || dto.getCurrentPassword().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false, "error", "현재 비밀번호를 입력해주세요."));
            }

            if (dto.getNewPassword() == null || dto.getNewPassword().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false, "error", "새 비밀번호를 입력해주세요."));
            }

            if (dto.getNewPassword().length() < 4) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false, "error", "새 비밀번호는 최소 4자 이상이어야 합니다."));
            }

            userService.changePassword(userPrincipal.getId(), dto.getCurrentPassword(), dto.getNewPassword());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "비밀번호가 성공적으로 변경되었습니다.");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            if (e.getMessage().contains("비밀번호")) {
                response.put("errorCode", "PASSWORD_MISMATCH");
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "비밀번호 변경 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PutMapping("/me/introduction-link")
    public ResponseEntity<?> updateIntroductionLink(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "error", "인증이 필요합니다."));
            }

            String introductionLink = request.get("introductionLink");
            
            // 빈 문자열도 허용 (링크 삭제)
            if (introductionLink == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false, "error", "introductionLink 필드가 필요합니다."));
            }

            User updatedUser = userService.updateIntroductionLink(userPrincipal.getId(), introductionLink);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "자기소개 링크가 업데이트되었습니다.");
            response.put("introductionLink", updatedUser.getIntroductionLink());

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "자기소개 링크 업데이트 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 닉네임 변경 신청 API
     */
    @PostMapping("/me/nickname-request")
    public ResponseEntity<?> requestNicknameChange(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "error", "인증이 필요합니다."));
            }

            String requestedNickname = request.get("requestedNickname");
            
            if (requestedNickname == null || requestedNickname.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false, "error", "변경할 닉네임을 입력해주세요."));
            }

            User updatedUser = userService.requestNicknameChange(userPrincipal.getId(), requestedNickname.trim());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "닉네임 변경 요청이 접수되었습니다. 관리자 승인을 기다려주세요.");
            response.put("requestedNickname", updatedUser.getRequestedNickname());

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            if (e.getMessage().contains("닉네임") || e.getMessage().contains("이미")) {
                response.put("errorCode", "NICKNAME_DUPLICATE");
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "닉네임 변경 요청 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 관리자 권한 확인 헬퍼 메서드
     */
    private boolean isAdmin(UserPrincipal userPrincipal) {
        // username 대신 role을 확인하도록 변경
        return userPrincipal != null && "pingddak".equals(userPrincipal.getRole());
    }

    /**
     * 닉네임 변경 요청 목록 조회 (관리자용)
     */
    @GetMapping("/admin/nickname-requests")
    public ResponseEntity<?> getNicknameRequests(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (!isAdmin(userPrincipal)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "error", "관리자 권한이 필요합니다."));
            }

            java.util.List<User> users = userService.findUsersWithNicknameRequests();
            
            java.util.List<Map<String, Object>> requestList = users.stream()
                    .map(user -> {
                        Map<String, Object> userInfo = new HashMap<>();
                        userInfo.put("id", user.getId());
                        userInfo.put("username", user.getUsername());
                        userInfo.put("currentNickname", user.getNickname());
                        userInfo.put("requestedNickname", user.getRequestedNickname());
                        return userInfo;
                    })
                    .collect(java.util.stream.Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("requests", requestList);
            response.put("count", requestList.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "요청 목록 조회 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 닉네임 변경 요청 승인 (관리자용)
     */
    @PutMapping("/admin/nickname-requests/{userId}/approve")
    public ResponseEntity<?> approveNicknameChange(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (!isAdmin(userPrincipal)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "error", "관리자 권한이 필요합니다."));
            }

            User updatedUser = userService.approveNicknameChange(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "닉네임 변경이 승인되었습니다.");
            response.put("userId", updatedUser.getId());
            response.put("username", updatedUser.getUsername());
            response.put("nickname", updatedUser.getNickname());

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "닉네임 변경 승인 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 닉네임 변경 요청 거절 (관리자용)
     */
    @PutMapping("/admin/nickname-requests/{userId}/reject")
    public ResponseEntity<?> rejectNicknameChange(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (!isAdmin(userPrincipal)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "error", "관리자 권한이 필요합니다."));
            }

            User updatedUser = userService.rejectNicknameChange(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "닉네임 변경 요청이 거절되었습니다.");
            response.put("userId", updatedUser.getId());
            response.put("username", updatedUser.getUsername());
            response.put("nickname", updatedUser.getNickname());

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "닉네임 변경 거절 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // DTO 클래스들
    public static class UserRegisterDto {
        private String username;
        private String password;
        private String nickname;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String getNickname() {
            return nickname;
        }

        public void setNickname(String nickname) {
            this.nickname = nickname;
        }
    }

    public static class UserLoginDto {
        private String username;
        private String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}

