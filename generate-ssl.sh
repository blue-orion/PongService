#!/bin/bash

mkdir -p nginx/ssl

if [ -f "nginx/ssl/cert.pem" ] && [ -f "nginx/ssl/key.pem" ]; then
    echo "SSL 인증서가 이미 존재합니다."
    exit 0
fi

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/key.pem \
    -out nginx/ssl/cert.pem \
    -subj "/C=KR/ST=Seoul/L=Seoul/O=Development/CN=*"
