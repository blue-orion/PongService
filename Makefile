.PHONY: build up down logs ssl clean

# SSL 인증서 생성
ssl:
	@echo "SSL 인증서 생성 중..."
	@./generate-ssl.sh

# Docker 이미지 빌드
build:
	@echo "Docker 이미지 빌드 중..."
	docker-compose build

# 서비스 시작
up: ssl
	@echo "서비스 시작 중..."
	docker-compose up -d

# 서비스 중지
down:
	@echo "서비스 중지 중..."
	docker-compose down

# 로그 확인
logs:
	docker-compose logs -f

# 백엔드 로그만 확인
logs-backend:
	docker-compose logs -f backend

# 프론트엔드 로그만 확인
logs-frontend:
	docker-compose logs -f frontend

# nginx 로그만 확인
logs-nginx:
	docker-compose logs -f nginx

# 전체 정리 (컨테이너, 이미지, 볼륨 삭제)
clean:
	@echo "Docker 환경 정리 중..."
	docker-compose down -v --rmi all
	docker system prune -f

# 개발 모드로 실행 (로그 출력)
dev: ssl
	@echo "개발 모드로 서비스 시작 중..."
	docker-compose up --build

# 서비스 재시작
restart:
	@echo "서비스 재시작 중..."
	docker-compose restart

# 상태 확인
status:
	docker-compose ps
