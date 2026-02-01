package com.chatspring.chatspring.jugot;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // CSRF 비활성화 (JWT 사용 시 세션을 사용하지 않으므로)
            .csrf(csrf -> csrf.disable())
            
            // 세션 관리 정책: STATELESS (JWT 사용)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            
            // 요청별 권한 설정
            .authorizeHttpRequests(auth -> auth
                // 공개 엔드포인트 (인증 불필요)
                .requestMatchers("/api/user/login", "/api/user/register").permitAll()
                // Jugot API - 조회 엔드포인트는 공개, 수정/삭제는 인증 필요
                .requestMatchers(
                    "/api/jugot",
                    "/api/jugot/test",
                    "/api/jugot/update-status",
                    "/api/jugot/all",
                    "/api/jugot/stocks/search",
                    "/api/jugot/realtrade/active",
                    "/api/jugot/realtrade/all",
                    "/api/jugot/realtrade/participants",
                    "/api/jugot/realtrade/participants/**"
                ).permitAll()
                // Jugot API - 수정/삭제 엔드포인트는 인증 필요
                .requestMatchers(
                    "/api/jugot/upload",
                    "/api/jugot/realtrade",
                    "/api/jugot/realtrade/*/join",
                    "/api/jugot/realtrade/*/leave",
                    "/api/jugot/realtrade/*/complete",
                    "/api/jugot/realtrade/*/pause",
                    "/api/jugot/realtrade/*/resume",
                    "/api/jugot/realtrade/**",
                    "/api/jugot/realtrade/admin"
                ).authenticated()
                // 기타 모든 요청은 인증 필요 (Fail Safe: 명시적으로 허용하지 않은 경로는 차단)
                .anyRequest().authenticated()
            )
            
            // JWT 인증 필터를 UsernamePasswordAuthenticationFilter 앞에 추가
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}










