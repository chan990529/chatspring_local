package com.chatspring.chatspring.kiwoom;

import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        // Connection Pool 설정
        PoolingHttpClientConnectionManager connectionManager = new PoolingHttpClientConnectionManager();
        connectionManager.setMaxTotal(100); // 전체 최대 연결 수
        connectionManager.setDefaultMaxPerRoute(20); // 각 도메인(IP)별 최대 연결 수

        // Connection Pool이 설정된 HttpClient 생성
        CloseableHttpClient httpClient = HttpClients.custom()
                .setConnectionManager(connectionManager)
                .evictIdleConnections(30L, java.util.concurrent.TimeUnit.SECONDS)
                .evictExpiredConnections()
                .build();

        // HttpComponents 4.x용 RequestFactory
        // Spring Boot 3.x의 HttpComponentsClientHttpRequestFactory는 5.x를 기대하므로
        // 4.x용 별도 구현을 사용합니다.
        ClientHttpRequestFactory factory = new HttpComponents4ClientHttpRequestFactory(httpClient);
        
        return new RestTemplate(factory);
    }
    
    // HttpComponents 4.x용 RequestFactory 구현
    private static class HttpComponents4ClientHttpRequestFactory implements ClientHttpRequestFactory {
        private final CloseableHttpClient httpClient;
        private int connectTimeout = 3000;
        private int readTimeout = 10000;
        private int connectionRequestTimeout = 2000;
        
        public HttpComponents4ClientHttpRequestFactory(CloseableHttpClient httpClient) {
            this.httpClient = httpClient;
        }
        
        @Override
        public org.springframework.http.client.ClientHttpRequest createRequest(
                java.net.URI uri, org.springframework.http.HttpMethod httpMethod) throws java.io.IOException {
            return new HttpComponents4ClientHttpRequest(httpClient, uri, httpMethod, 
                    connectTimeout, readTimeout, connectionRequestTimeout);
        }
    }
    
    // HttpComponents 4.x용 ClientHttpRequest 구현
    private static class HttpComponents4ClientHttpRequest implements org.springframework.http.client.ClientHttpRequest {
        private final CloseableHttpClient httpClient;
        private final java.net.URI uri;
        private final org.springframework.http.HttpMethod httpMethod;
        private final int connectTimeout;
        private final int readTimeout;
        private final int connectionRequestTimeout;
        private org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        private java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
        
        public HttpComponents4ClientHttpRequest(CloseableHttpClient httpClient, java.net.URI uri, 
                org.springframework.http.HttpMethod httpMethod, int connectTimeout, 
                int readTimeout, int connectionRequestTimeout) {
            this.httpClient = httpClient;
            this.uri = uri;
            this.httpMethod = httpMethod;
            this.connectTimeout = connectTimeout;
            this.readTimeout = readTimeout;
            this.connectionRequestTimeout = connectionRequestTimeout;
        }
        
        @Override
        public org.springframework.http.HttpMethod getMethod() {
            return httpMethod;
        }
        
        @Override
        public java.net.URI getURI() {
            return uri;
        }
        
        @Override
        public org.springframework.http.HttpHeaders getHeaders() {
            return headers;
        }
        
        @Override
        public java.io.OutputStream getBody() throws java.io.IOException {
            return body;
        }
        
        @Override
        public org.springframework.http.client.ClientHttpResponse execute() throws java.io.IOException {
            org.apache.http.client.methods.HttpUriRequest request = createHttpRequest();
            
            try {
                org.apache.http.HttpResponse response = httpClient.execute(request);
                return new HttpComponents4ClientHttpResponse(response);
            } catch (org.apache.http.client.ClientProtocolException e) {
                throw new java.io.IOException("HTTP protocol error", e);
            } catch (java.io.IOException e) {
                throw e;
            }
        }
        
        private org.apache.http.client.methods.HttpUriRequest createHttpRequest() {
            org.apache.http.client.methods.HttpUriRequest request;
            
            if (httpMethod == org.springframework.http.HttpMethod.GET) {
                request = new org.apache.http.client.methods.HttpGet(uri);
            } else if (httpMethod == org.springframework.http.HttpMethod.POST) {
                org.apache.http.client.methods.HttpPost postRequest = new org.apache.http.client.methods.HttpPost(uri);
                if (body.size() > 0) {
                    org.apache.http.entity.ContentType contentType = org.apache.http.entity.ContentType.APPLICATION_JSON;
                    String contentTypeHeader = headers.getFirst(org.springframework.http.HttpHeaders.CONTENT_TYPE);
                    if (contentTypeHeader != null) {
                        contentType = org.apache.http.entity.ContentType.parse(contentTypeHeader);
                    }
                    postRequest.setEntity(new org.apache.http.entity.ByteArrayEntity(body.toByteArray(), contentType));
                }
                request = postRequest;
            } else if (httpMethod == org.springframework.http.HttpMethod.PUT) {
                org.apache.http.client.methods.HttpPut putRequest = new org.apache.http.client.methods.HttpPut(uri);
                if (body.size() > 0) {
                    org.apache.http.entity.ContentType contentType = org.apache.http.entity.ContentType.APPLICATION_JSON;
                    String contentTypeHeader = headers.getFirst(org.springframework.http.HttpHeaders.CONTENT_TYPE);
                    if (contentTypeHeader != null) {
                        contentType = org.apache.http.entity.ContentType.parse(contentTypeHeader);
                    }
                    putRequest.setEntity(new org.apache.http.entity.ByteArrayEntity(body.toByteArray(), contentType));
                }
                request = putRequest;
            } else if (httpMethod == org.springframework.http.HttpMethod.DELETE) {
                request = new org.apache.http.client.methods.HttpDelete(uri);
            } else {
                throw new IllegalArgumentException("Unsupported HTTP method: " + httpMethod);
            }
            
            // 헤더 설정 (Content-Type은 Entity에 이미 설정됨)
            for (java.util.Map.Entry<String, java.util.List<String>> entry : headers.entrySet()) {
                String headerName = entry.getKey();
                if (!org.springframework.http.HttpHeaders.CONTENT_TYPE.equalsIgnoreCase(headerName)) {
                    for (String value : entry.getValue()) {
                        request.addHeader(headerName, value);
                    }
                }
            }
            
            return request;
        }
    }
    
    // HttpComponents 4.x용 ClientHttpResponse 구현
    private static class HttpComponents4ClientHttpResponse implements org.springframework.http.client.ClientHttpResponse {
        private final org.apache.http.HttpResponse httpResponse;
        
        public HttpComponents4ClientHttpResponse(org.apache.http.HttpResponse httpResponse) {
            this.httpResponse = httpResponse;
        }
        
        @Override
        public org.springframework.http.HttpStatusCode getStatusCode() throws java.io.IOException {
            return org.springframework.http.HttpStatusCode.valueOf(httpResponse.getStatusLine().getStatusCode());
        }
        
        @Override
        public String getStatusText() throws java.io.IOException {
            return httpResponse.getStatusLine().getReasonPhrase();
        }
        
        @Override
        public void close() {
            org.apache.http.HttpEntity entity = httpResponse.getEntity();
            if (entity != null) {
                try {
                    java.io.InputStream content = entity.getContent();
                    if (content != null) {
                        content.close();
                    }
                } catch (Exception e) {
                    // 무시
                }
            }
        }
        
        @Override
        public java.io.InputStream getBody() throws java.io.IOException {
            org.apache.http.HttpEntity entity = httpResponse.getEntity();
            return entity != null ? entity.getContent() : new java.io.ByteArrayInputStream(new byte[0]);
        }
        
        @Override
        public org.springframework.http.HttpHeaders getHeaders() {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            for (org.apache.http.Header header : httpResponse.getAllHeaders()) {
                headers.add(header.getName(), header.getValue());
            }
            return headers;
        }
    }
}

