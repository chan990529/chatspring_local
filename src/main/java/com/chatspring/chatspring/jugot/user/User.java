package com.chatspring.chatspring.jugot.user;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String nickname;

    @Column(name = "requested_nickname")
    private String requestedNickname; // 닉네임 변경 요청 (관리자 승인 대기)

    @Column(name = "introduction_link")
    private String introductionLink; // 자기소개 링크 (노션 등)

    @Column(nullable = false)
    private String role; // 기본 권한은 USER

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "is_approved")
    private Boolean isApproved; // 회원가입 승인 여부 (관리자 승인 후 true)

    @PrePersist
    protected void onCreate() {
        if (role == null || role.isEmpty()) {
            role = "USER";
        }
        if (isApproved == null) {
            isApproved = false; // 일반 가입은 무조건 승인 대기
        }
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getRequestedNickname() {
        return requestedNickname;
    }

    public void setRequestedNickname(String requestedNickname) {
        this.requestedNickname = requestedNickname;
    }

    public String getIntroductionLink() {
        return introductionLink;
    }

    public void setIntroductionLink(String introductionLink) {
        this.introductionLink = introductionLink;
    }

    public Boolean getIsApproved() {
        return isApproved;
    }

    public void setIsApproved(Boolean isApproved) {
        this.isApproved = isApproved;
    }
}

