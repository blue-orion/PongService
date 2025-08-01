.PHONY: build up down logs ssl clean

ssl:
	@echo "SSL 인증서 생성 중..."
	@./generate-ssl.sh

build:
	@echo "Docker 이미지 빌드 중..."
	docker-compose build

up: ssl
	@echo "서비스 시작 중..."
	docker-compose up -d

down:
	@echo "서비스 중지 중..."
	docker-compose down

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-nginx:
	docker-compose logs -f nginx

clean:
	@echo "Docker 환경 정리 중..."
	docker-compose down -v --rmi all
	docker system prune -f

restart:
	@echo "서비스 재시작 중..."
	docker-compose restart

status:
	docker-compose ps
