package com.chatspring.chatspring.jugot;

import com.fasterxml.jackson.annotation.JsonProperty;

// [변경 시작] Personal Trade 기능을 위한 참여자 요약 DTO
public class ParticipantSummaryDto {
    private String name;         // 참여자 이름/닉네임
    private int activeCount;     // 현재 참여 중인 실매매 건수
    private int totalCount;      // 전체 참여 기록 수

    public ParticipantSummaryDto() {}

    public ParticipantSummaryDto(String name, int activeCount, int totalCount) {
        this.name = name;
        this.activeCount = activeCount;
        this.totalCount = totalCount;
    }

    @JsonProperty("name")
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @JsonProperty("activeCount")
    public int getActiveCount() {
        return activeCount;
    }

    public void setActiveCount(int activeCount) {
        this.activeCount = activeCount;
    }

    @JsonProperty("totalCount")
    public int getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(int totalCount) {
        this.totalCount = totalCount;
    }
}
// [변경 끝]



