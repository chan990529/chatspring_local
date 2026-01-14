package com.chatspring.chatspring.jugot;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

public class ParticipantDto {
    private Long id;
    private String nickname;
    private LocalDateTime joinedAt;

    public ParticipantDto() {}

    public ParticipantDto(Long id, String nickname, LocalDateTime joinedAt) {
        this.id = id;
        this.nickname = nickname;
        this.joinedAt = joinedAt;
    }

    @JsonProperty("id")
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @JsonProperty("nickname")
    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    @JsonProperty("joinedAt")
    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }
}
