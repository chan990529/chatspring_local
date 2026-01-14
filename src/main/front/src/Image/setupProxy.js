const { createProxyMiddleWare} = require('http-proxy-middleware');

// config 파일에서 가져오기 (Node.js 환경에서는 require 사용)
// 주의: config.js는 ES6 모듈이므로, 여기서는 직접 값을 사용하거나
// 별도의 config 파일을 만들어야 합니다.
// 일단 기본값으로 설정하고, 필요시 환경변수나 다른 방법으로 관리하세요.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

module.exports = function(app){
    app.use(
        '/api',
        createProxyMiddleWare({
            target : API_BASE_URL,
            changeOrigin : true,
        })
    );
};