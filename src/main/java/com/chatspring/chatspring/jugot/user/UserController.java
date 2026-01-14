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
        
        Map<String, Object> response = new HashMap<>();
        response.put("auth", true);
        response.put("username", userPrincipal.getUsername());
        response.put("nickname", userPrincipal.getNickname());
        response.put("id", userPrincipal.getId());
        response.put("role", userPrincipal.getRole());

        return ResponseEntity.ok(response);
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

