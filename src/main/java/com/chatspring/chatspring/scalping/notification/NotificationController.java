//package com.chatspring.chatspring.notification;
//
//import org.springframework.messaging.simp.SimpMessagingTemplate;
//import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.RequestBody;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RestController;
//
//@RestController
//@RequestMapping("/api/notifications")
//public class NotificationController {
//
//    private final SimpMessagingTemplate messagingTemplate;
//
//    public NotificationController(SimpMessagingTemplate messagingTemplate) {
//        this.messagingTemplate = messagingTemplate;
//    }
//
//    @PostMapping("/send")
//    public void sendNotification(@RequestBody NotificationMessage message) {
//        messagingTemplate.convertAndSend("/topic/trade", message);
//    }
//}