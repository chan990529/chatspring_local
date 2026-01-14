package com.chatspring.chatspring.scalping.stock.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DailyCandleDto {
    private String date; // 날짜를 받을 필드 (프론트엔드와 맞추기 위함)

    @JsonProperty("open") // JSON의 '시가' 키와 매핑
    private int open;

    @JsonProperty("high")
    private int high;

    @JsonProperty("low")
    private int low;

    @JsonProperty("close")
    private int close;

    @JsonProperty("volume")
    private long volume;
}