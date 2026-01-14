package com.chatspring.chatspring.scalping.notification;

import org.json.JSONObject;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.ConcurrentHashMap;
import java.util.List;



@RestController
@RequestMapping("/api/notifications")
public class PushController {

    private final PushNotificationService pushNotificationService;
    private final PushSubscriptionRepository pushSubscriptionRepository;

    public PushController(PushNotificationService pushNotificationService, PushSubscriptionRepository repository) {
        this.pushNotificationService = pushNotificationService;
        this.pushSubscriptionRepository = repository;
    }


    // 메모리에 구독 정보 저장 (실제로는 DB 사용)
    private final ConcurrentHashMap<String, PushSubscription> subscriptions = new ConcurrentHashMap<>();

    @PostMapping("/save-subscription")
    public String saveSubscription(@RequestBody PushSubscription subscription) {
        // 중복 확인
        if (pushSubscriptionRepository.existsByEndpoint(subscription.getEndpoint())) {
            return "이미 구독 정보가 존재합니다.";
        }

        // 중복이 없으면 저장
        pushSubscriptionRepository.save(subscription);
        System.out.println("구독 정보 저장 완료: " + subscription);
        return "구독 정보 저장 성공";
    }

    // Java
    @PostMapping("/send")
    public String sendPushNotification(@RequestBody NotificationMessage message) {
        List<PushSubscription> subscriptions = pushSubscriptionRepository.findAll();

        subscriptions.forEach(subscription -> {
            try {
                String payload = createPayload(message);
                pushNotificationService.sendPushNotificationAsync(
                        subscription.getEndpoint(),
                        subscription.getKeys().getP256dh(),
                        subscription.getKeys().getAuth(),
                        payload
                );
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
        return "푸시 알림 발송 요청 완료";
    }

    // 페이로드 생성 메서드
    private String createPayload(NotificationMessage msg) {
        String title, body, icon;
        switch (msg.getType()) {
            case "sell_0.7":
                title = "매도 완료";
                icon  = "/icons/profit07.png";
                body  = msg.getMessage() + " 0.7% 수익";
                break;
            case "sell_1":
                title = "매도 완료";
                icon  = "/icons/profit1.png";
                body  = msg.getMessage() + " 1% 수익";
                break;
            case "stop_loss":
                title = "손절 알림";
                icon  = "/icons/stoploss.png";
                body  = msg.getMessage() + " 손절";
                break;
            case "new":
                title = "신규 입점";
                icon  = "/icons/new.png";
                body  = msg.getMessage() + " 신규 입점";
                break;
            default:
                title = "알림";
                icon  = "/icons/default.png";
                body  = msg.getMessage() != null ? msg.getMessage() : msg.getStockName();
        }

        // JSON 객체로 만들어 보내기
        JSONObject payload = new JSONObject();
        payload.put("title", title);
        payload.put("body",  body);
        payload.put("icon",  icon);
        payload.put("stockName", msg.getStockName());
        payload.put("type", msg.getType());

        // 클릭 시 이동할 URL 등 추가 데이터
        JSONObject data = new JSONObject();
        data.put("url", "/trade-details");
        payload.put("data", data);

        return payload.toString();
    }



}