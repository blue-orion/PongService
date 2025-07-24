#!/bin/sh

# 환경 변수 설정
ENV_FILE=${ENV_FILE:-.env.prod}

echo "Using environment file: $ENV_FILE"

# 선택된 환경 파일을 .env로 복사
cp $ENV_FILE .env

npx prisma studio --hostname 0.0.0.0 &

npm start
