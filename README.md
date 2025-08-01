# PongService
실시간 멀티플레이 Pong 게임 서비스로, 로비 생성, 매칭, 실시간 플레이를 지원합니다.

## 개요

> PongService는 확장 가능한 백엔드와 모던 프론트를 제공하여 실시간 Pong 게임을 호스팅합니다. 사용자는 로비를 생성하거나 가입하여 친구와 매칭하고 브라우저에서 라이브 멀티플레이를 즐길 수 있습니다.

## 주요 기능

- WebSockets를 통한 실시간 게임 통신
- 로비 생성, 참여 및 자동 매칭
- JWT & OAuth2를 활용한 사용자 인증
- Fastify 및 Prisma ORM 기반 RESTful API
- Vite, TypeScript, Tailwind CSS로 구축된 반응형 프론트엔드
- Docker로 서비스 컨테이너화 및 배포 간소화
- 백엔드 서비스용 Jest 테스트 스위트

## 아키텍처

- **백엔드**: Node.js, Fastify, Prisma, WebSocket 관리
- **데이터베이스**: SQLite (Prisma로 관리)
- **프론트엔드**: Vite, TypeScript, Tailwind CSS
- **배포**: Docker, Docker Compose, Nginx 리버스 프록시

## 기술 스택

| 계층       | 기술                                     |
| :--------- | :--------------------------------------- |
| 백엔드     | Node.js, Fastify, Prisma, WebSocket      |
| 데이터베이스 | SQLite (Prisma)                         |
| 프론트엔드 | Vite, TypeScript                          |
| 스타일링   | Tailwind CSS                             |
| 테스트     | Jest (백엔드), Vitest (프론트엔드, 도입 예정)         |
| DevOps     | Docker, Docker Compose, Nginx            |

## 시작하기

### 필수 요구사항

- Docker & Docker Compose
- Node.js >= 16.x
- npm 또는 yarn

### 설치

```bash
# 레포지토리 복제
git clone https://github.com/blue-orion/PongService.git
cd PongService

# 백엔드 의존성 설치
cd tsen-back
npm install

# 프론트엔드 의존성 설치
cd ../tsen-front
npm install
```

### 환경 설정

환경 파일을 복사하고 설정을 수정하세요:

```bash
cp tsen-back/.env.example tsen-back/.env
cp tsen-front/.env.example tsen-front/.env
```

`tsen-back/.env`에서 데이터베이스 자격 증명 및 기타 설정을 업데이트합니다.

### 앱 실행

#### Docker Compose 사용
```bash
docker-compose up --build
```
- `nginx` - 리버스 프록시
- `tsen-back` - API & WebSocket 서버
- `tsen-front` - 정적 프론트엔드

#### 로컬 개발

```bash
# 백엔드 시작
cd tsen-back
npm run dev

# 프론트엔드 시작
cd ../tsen-front
npm run dev
```

## API 참고

`tsen-back/src/domains/**/friendDoc.md` 및 Swagger UI(설정 시)를 참조하세요.

## Author

> Developed by [blue-orion](https://github.com/blue-orion)  
> Portfolio: [https://your-portfolio.example.com](https://your-portfolio.example.com)
