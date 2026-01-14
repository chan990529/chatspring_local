package com.chatspring.chatspring.scalping.notification;

import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.security.Security;

@Service
public class PushNotificationService {

    @Value("${vapid.public.key}")
    private String publicKey;

    @Value("${vapid.private.key}")
    private String privateKey;

    @Value("${vapid.subject}")
    private String subject;

    public PushNotificationService() {
        Security.addProvider(new BouncyCastleProvider());
    }

    @Async("taskExecutor")
    public void sendPushNotificationAsync(String endpoint, String p256dh, String auth, String payload) throws Exception {
        PushService pushService = new PushService();
        pushService.setPublicKey(publicKey);
        pushService.setPrivateKey(privateKey);
        pushService.setSubject(subject);

        Notification notification = new Notification(endpoint, p256dh, auth, payload);
        HttpResponse response = pushService.send(notification);
        System.out.println("푸시 응답 코드: " + response.getStatusLine().getStatusCode());
    }
}