package com.chatspring.chatspring.scalping.openai;

import java.util.HashMap;
import java.util.Map;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
class AIController {
	private final ChatClient chatClient;

	AIController(ChatClient chatClient) {
		this.chatClient = chatClient;
	}
	@PostMapping("/api/chat")
	public Map<String, String> chat(@RequestBody Map<String, String> request, HttpSession session) {
	        // 세션에서 대화 기록 가져오기
	        ChatHistory chatHistory = (ChatHistory) session.getAttribute("chatHistory");

	        // 대화 기록이 없으면 새로 생성
	        if (chatHistory == null) {
	            chatHistory = new ChatHistory();
	            session.setAttribute("chatHistory", chatHistory);
	        }

	        // 새 메시지 추가
	        String userMessage = request.get("message");
	        chatHistory.addMessage("User: " + userMessage);

	        // AI 응답 생성
			String aiResponse = chatClient.prompt()
	                                  .user(userMessage)
	                                  .call()
	                                  .content(); // 실제 OpenAI 응답
	    	chatHistory.addMessage("AI: " + aiResponse);

	        // 결과 반환
	        Map<String, String> response = new HashMap<>();
	        response.put("completion", aiResponse);
	        return response;
	    }

	@PostMapping("/api/clear")
	public Map<String, String> clearChat(HttpSession session) {
	    // 세션에서 대화 기록 가져오기
	    ChatHistory chatHistory = (ChatHistory) session.getAttribute("chatHistory");

	    // 대화 기록이 있으면 초기화
	    if (chatHistory != null) {
	        chatHistory.clearMessages(); // 메시지 기록 초기화
	    }

	    // 응답 반환
	    Map<String, String> response = new HashMap<>();
	    response.put("status", "success");
	    response.put("message", "대화 기록이 초기화되었습니다.");
	    return response;
	}
}
