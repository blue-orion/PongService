#!/bin/bash

mkdir -p nginx/ssl

if [ -f "nginx/ssl/cert.pem" ] && [ -f "nginx/ssl/key.pem" ]; then
    echo "SSL 인증서가 이미 존재합니다."
    # tsen-back/ssl 디렉토리에도 복사
    mkdir -p tsen-back/ssl
    cp nginx/ssl/cert.pem tsen-back/ssl/cert.pem
    cp nginx/ssl/key.pem tsen-back/ssl/key.pem
    exit 0
fi

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/key.pem \
    -out nginx/ssl/cert.pem \
    -subj "/C=KR/ST=Seoul/L=Seoul/O=Development/CN=*"

# 생성된 인증서를 tsen-back/ssl 디렉토리에도 복사
mkdir -p tsen-back/ssl
cp nginx/ssl/cert.pem tsen-back/ssl/cert.pem
cp nginx/ssl/key.pem tsen-back/ssl/key.pem
