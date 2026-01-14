package com.chatspring.chatspring.jugot.user;

public class UserInfoUpdateDto {
    private String introductionLink;
    private String requestedNickname;

    public String getIntroductionLink() {
        return introductionLink;
    }

    public void setIntroductionLink(String introductionLink) {
        this.introductionLink = introductionLink;
    }

    public String getRequestedNickname() {
        return requestedNickname;
    }

    public void setRequestedNickname(String requestedNickname) {
        this.requestedNickname = requestedNickname;
    }
}
