import axios from 'axios';
import config from './config';

// axios 인스턴스 생성
const axiosInstance = axios.create({
    baseURL: config.API_BASE_URL,
    withCredentials: true, // 쿠키 자동 전송 (HttpOnly Cookie 사용)
});

// 요청 인터셉터: 쿠키 방식 사용 시 별도 토큰 헤더 추가 불필요
// 백엔드에서 HttpOnly Cookie로 토큰을 관리하므로, withCredentials: true만으로 충분
axiosInstance.interceptors.request.use(
    (config) => {
        // 쿠키 방식 사용: 토큰은 HttpOnly Cookie로 자동 전송됨
        // 별도의 Authorization 헤더 추가 불필요
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터: 401 오류 시 처리
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // 인증 실패 시: 쿠키는 백엔드에서 자동으로 제거됨
            // 프론트엔드에서는 별도 처리 불필요 (필요시 로그인 페이지로 리다이렉트 가능)
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
