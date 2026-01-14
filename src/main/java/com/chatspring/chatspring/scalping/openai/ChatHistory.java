package com.chatspring.chatspring.scalping.openai;

import java.util.ArrayList;
import java.util.List;

public class ChatHistory {
    private List<String> messages = new ArrayList<>();

    public List<String> getMessages() {
        return messages;
    }

    public void addMessage(String message) {
        messages.add(message);
    }

    public void clearMessages() {
        messages.clear();
    }
}
