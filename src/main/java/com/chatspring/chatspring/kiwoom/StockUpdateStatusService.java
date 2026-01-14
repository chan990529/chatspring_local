package com.chatspring.chatspring.kiwoom;

import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 주가 데이터 업데이트 진행 상태를 추적하는 서비스
 */
@Service
public class StockUpdateStatusService {
    
    private final AtomicBoolean isUpdating = new AtomicBoolean(false);
    
    /**
     * 업데이트 시작
     */
    public void startUpdate() {
        isUpdating.set(true);
    }
    
    /**
     * 업데이트 종료
     */
    public void endUpdate() {
        isUpdating.set(false);
    }
    
    /**
     * 업데이트 진행 중인지 확인
     */
    public boolean isUpdating() {
        return isUpdating.get();
    }
}






