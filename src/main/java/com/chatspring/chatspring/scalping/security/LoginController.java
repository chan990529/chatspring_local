package com.chatspring.chatspring.scalping.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Date;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class LoginController {

    private static String VALID_LOGIN_CODE = "chiman"; // 초기 유효 코드
    private static final String AUTH_KEY = "IAMCHIMAN"; // 코드 변경을 위한 인증키
    private static final String MASTER_KEY = "IAMCHIMAN1357";
    // JWT 토큰 생성을 위한 비밀키 (실제 운영 환경에서는 안전하게 관리해야 합니다)
    private static final String SECRET_KEY = "MAKEMONEYWITHCHIMAN000";

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request, HttpServletResponse response) {
        String code = request.get("code");

        if (VALID_LOGIN_CODE.equals(code) || MASTER_KEY.equals(code)) {
            long expirationTime;
            if (MASTER_KEY.equals(code)) {
                expirationTime = 100L * 365 * 24 * 60 * 60 * 1000;
            } else {
                expirationTime = 10 * 60 * 60 * 1000;
            }
            Date now = new Date();
            Date expiryDate = new Date(now.getTime() + expirationTime);

            String token = Jwts.builder()
                    .setSubject("user")
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

            return ResponseEntity.ok(Map.of("token", token));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "로그인 실패"));
        }
    }

    @GetMapping("/check-auth")
    public ResponseEntity<Map<String, Object>> checkAuth(@CookieValue(value = "authToken", required = false) String token) {
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("auth", false));
        }
        try {
            Jwts.parser()
                    .setSigningKey(SECRET_KEY.getBytes())
                    .parseClaimsJws(token);
            return ResponseEntity.ok(Map.of("auth", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("auth", false));
        }
    }

    @PostMapping("/change-code")
    public ResponseEntity<String> changeCode(@RequestBody Map<String, String> request) {
        String newPassword = request.get("newPassword"); // 변경할 비밀번호
        String authKey = request.get("authKey"); // 인증키 검증

        if (AUTH_KEY.equals(authKey)) {
            VALID_LOGIN_CODE = newPassword;
            return ResponseEntity.ok("로그인 코드가 성공적으로 변경되었습니다.");
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("인증키가 일치하지 않습니다.");
        }
    }
}