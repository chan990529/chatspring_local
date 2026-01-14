package com.chatspring.chatspring.jugot;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;

/**
 * JWT 토큰 생성 및 검증을 담당하는 유틸리티 클래스
 */
@Component
public class JwtTokenProvider {

    private final String secretKey;

    public JwtTokenProvider(@Value("${jwt.secret}") String secretKey) {
        this.secretKey = secretKey;
    }

    /**
     * JWT 토큰 생성
     * 
     * @param subject 토큰의 주체 (일반적으로 사용자명)
     * @param claims 추가 클레임 정보
     * @param expirationTime 만료 시간 (밀리초)
     * @return 생성된 JWT 토큰
     */
    public String createToken(String subject, Claims claims, long expirationTime) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationTime);

        var builder = Jwts.builder()
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS256, secretKey.getBytes());

        if (claims != null) {
            builder.setClaims(claims);
        }

        return builder.compact();
    }

    /**
     * JWT 토큰 검증
     * 
     * @param token 검증할 JWT 토큰
     * @return 토큰이 유효하면 true, 그렇지 않으면 false
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .setSigningKey(secretKey.getBytes())
                    .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * JWT 토큰에서 Claims 추출
     * 
     * @param token JWT 토큰
     * @return Claims 객체
     * @throws Exception 토큰이 유효하지 않은 경우
     */
    public Claims getClaims(String token) throws Exception {
        return Jwts.parser()
                .setSigningKey(secretKey.getBytes())
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * JWT 토큰에서 사용자 ID 추출
     * 
     * @param token JWT 토큰
     * @return 사용자 ID
     * @throws Exception 토큰이 유효하지 않은 경우
     */
    public Long getUserId(String token) throws Exception {
        Claims claims = getClaims(token);
        Object id = claims.get("id");
        if (id instanceof Number) {
            return ((Number) id).longValue();
        }
        return null;
    }

    /**
     * JWT 토큰에서 닉네임 추출
     * 
     * @param token JWT 토큰
     * @return 닉네임
     * @throws Exception 토큰이 유효하지 않은 경우
     */
    public String getNickname(String token) throws Exception {
        Claims claims = getClaims(token);
        return (String) claims.get("nickname");
    }

    /**
     * JWT 토큰에서 사용자명(subject) 추출
     * 
     * @param token JWT 토큰
     * @return 사용자명
     * @throws Exception 토큰이 유효하지 않은 경우
     */
    public String getUsername(String token) throws Exception {
        Claims claims = getClaims(token);
        return claims.getSubject();
    }

    /**
     * JWT 토큰에서 역할(role) 추출
     * 
     * @param token JWT 토큰
     * @return 역할
     * @throws Exception 토큰이 유효하지 않은 경우
     */
    public String getRole(String token) throws Exception {
        Claims claims = getClaims(token);
        return (String) claims.get("role");
    }
}
