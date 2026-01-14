import React, { useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import EmptyImage from './Empty.png';
import OpenImage from './Open.png';
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import config from '../../config';


const MAX_NOTIFICATIONS = 3;
const notificationsQueue = [];

const TradeNotification = () => {
    useEffect(() => {
        // 권한 확인
        const savedAuth = localStorage.getItem('user_auth');
        if (!savedAuth || new Date(JSON.parse(savedAuth).expiry) < new Date()) {
            return;
        }

        // 알림 권한 요청
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }

        const socketUrl = config.WS_URL;  // 실제 서버 주소로 변경
        const socket = () => new SockJS(socketUrl);
        const stompClient = Stomp.over(socket);

        stompClient.connect({}, () => {
            const dts = Math.floor(Date.now());
            stompClient.subscribe('/topic/trade', (message) => {
                if (message.body) {
                    const notification = JSON.parse(message.body);

                    // 매도인지 손절인지에 따라 다르게 알림을 띄움
                    if (notification.type === '매도') {
                        showNotification("매도 완료", {
                            body: `매도 완료: ${notification.message}`,
                            icon : OpenImage,
                            timestamp: dts
                        });
                    } else if (notification.type === '손절') {
                        showNotification("손절 발생", {
                            body: `손절 발생: ${notification.message}`,
                            icon : EmptyImage,
                            timestamp: dts
                        });
                    }
                }
            });
        }, (error) => {
            console.error('WebSocket connection error:', error);
        });

        return () => {
            if (stompClient) {
                stompClient.disconnect(() => {
                    console.log('WebSocket disconnected');
                });
            }
        };
    }, []);

    // Notification API를 사용한 알림 함수 정의
    const showNotification = (title, options) => {
        if (Notification.permission === 'granted') {
            // 알림이 3개 이상인 경우 첫 번째 알림을 닫음
            if (notificationsQueue.length >= MAX_NOTIFICATIONS) {
                const oldestNotification = notificationsQueue.shift();
                oldestNotification.close();
            }

            const newNotification = new Notification(title, options);
            notificationsQueue.push(newNotification);
        } else {
            console.log('알림 권한이 없습니다.');
        }
    };

    return null; // 이 컴포넌트는 UI 요소를 반환하지 않음
};



export default TradeNotification;
