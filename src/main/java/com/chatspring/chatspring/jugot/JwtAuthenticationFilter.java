package com.chatspring.chatspring.jugot;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT 토큰을 추출하고 검증하여 SecurityContext에 인증 정보를 설정하는 필터
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        // 토큰 추출
        String token = extractToken(request);
        
        if (token != null && jwtTokenProvider.validateToken(token)) {
            try {
                // 토큰에서 사용자 정보 추출
                Long userId = jwtTokenProvider.getUserId(token);
                String username = jwtTokenProvider.getUsername(token);
                String nickname = jwtTokenProvider.getNickname(token);
                String role = jwtTokenProvider.getRole(token);
                
                // UserPrincipal 생성
                UserPrincipal userPrincipal = new UserPrincipal(userId, username, nickname, role);
                
                // Authentication 객체 생성
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userPrincipal,
                        null,
                        userPrincipal.getAuthorities()
                );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                
                // SecurityContext에 인증 정보 저장
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception e) {
                // 토큰 파싱 실패 시 로그만 남기고 계속 진행 (인증되지 않은 요청으로 처리)
                logger.debug("JWT 토큰 파싱 실패: " + e.getMessage());
                // 토큰이 유효하지 않으면 SecurityContext 클리어
                SecurityContextHolder.clearContext();
            }
        } else if (token != null) {
            // 토큰이 있지만 유효하지 않은 경우 SecurityContext 클리어
            SecurityContextHolder.clearContext();
        }
        // 토큰이 없으면 아무것도 하지 않음 (STATELESS 정책이므로 매 요청마다 인증 필요)
        
        filterChain.doFilter(request, response);
    }

    /**
     * 요청에서 JWT 토큰을 추출합니다.
     * 1. Authorization 헤더에서 Bearer 토큰 추출
     * 2. 쿠키에서 authToken 추출
     */
    private String extractToken(HttpServletRequest request) {
        // Authorization 헤더에서 토큰 추출
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        
        // 쿠키에서 토큰 추출
        jakarta.servlet.http.Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (jakarta.servlet.http.Cookie cookie : cookies) {
                if ("authToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        
        return null;
    }
}
