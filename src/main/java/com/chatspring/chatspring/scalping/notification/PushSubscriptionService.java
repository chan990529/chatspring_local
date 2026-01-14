package com.chatspring.chatspring.scalping.notification;

import org.springframework.stereotype.Service;

@Service
public class PushSubscriptionService {

    private final PushSubscriptionRepository repository;

    public PushSubscriptionService(PushSubscriptionRepository repository) {
        this.repository = repository;
    }

    public PushSubscription save(PushSubscription subscription) {
        return repository.save(subscription);
    }
}
