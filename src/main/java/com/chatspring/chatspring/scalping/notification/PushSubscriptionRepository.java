package com.chatspring.chatspring.scalping.notification;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {
    // 엔드포인트로 구독 검색
    PushSubscription findByEndpoint(String endpoint);

    boolean existsByEndpoint(String endpoint);
}
