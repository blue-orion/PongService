# PongService
# A real-time multiplayer Pong game service with lobby, matchmaking, and live gameplay.
Built with Node.js, Express, Prisma, WebSockets, TypeScript, and Vite.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Configuration](#configuration)
   - [Running the App](#running-the-app)
6. [API Reference](#api-reference)
7. [Testing](#testing)
8. [Contributing](#contributing)
9. [License](#license)
10. [Author](#author)

## Overview

> PongService provides a scalable backend and modern frontend for hosting real-time Pong games. Users can create or join lobbies, match with friends, and play live multiplayer matches in their browser.

## Features

- Real-time game communication via WebSockets
- Lobby creation, join, and matchmaking
- User authentication with JWT & OAuth2
- RESTful APIs powered by Fastify & Prisma ORM
- Responsive frontend built with Vite, TypeScript, and Tailwind CSS
- Dockerized services for easy deployment
- Comprehensive Jest test suite for backend services

## Architecture

![Architecture Diagram](./nginx/architecture.png)

- **Backend**: Node.js, Fastify, Prisma, WebSocket manager  
- **Database**: SQLite (handled by Prisma)  
- **Frontend**: Vite, TypeScript, Tailwind CSS  
- **Deployment**: Docker, Docker Compose, and Nginx reverse proxy  

## Tech Stack

| Layer        | Technologies                          |
| :----------- | :------------------------------------ |
| Backend      | Node.js, Fastify, Prisma, WebSocket   |
| Database     | SQLite via Prisma                    |
| Frontend     | Vite, TypeScript, (Vue/React)         |
| Styling      | Tailwind CSS                          |
| Testing      | Jest (Backend), Vitest (Frontend)     |
| DevOps       | Docker, Docker Compose, Nginx         |

## Getting Started

### Prerequisites

- Docker & Docker Compose  
- Node.js >= 16.x  
- npm or yarn  

### Installation

```bash
# Clone the repository
git clone https://github.com/blue-orion/PongService.git
cd PongService

# Install backend dependencies
cd tsen-back
npm install

# Install frontend dependencies
cd ../tsen-front
npm install
```

### Configuration

Copy environment files and adjust settings:

```bash
cp tsen-back/.env.example tsen-back/.env
cp tsen-front/.env.example tsen-front/.env
```

Update database credentials in `tsen-back/.env` and other settings as needed.

### Running the App

#### Using Docker Compose
```bash
docker-compose up --build
```
Services:
- `nginx` - reverse proxy  
- `tsen-back` - API & WebSocket server  
- `tsen-front` - Static frontend  

#### Local Development

```bash
# Start backend
cd tsen-back
npm run dev

# Start frontend
cd ../tsen-front
npm run dev
```

## API Reference

See detailed API documentation in `tsen-back/src/domains/**/friendDoc.md` and Swagger UI (if configured).

## Testing

### Backend Tests
```bash
cd tsen-back
npm test
```

### Frontend Tests
```bash
cd tsen-front
npm test
```

## Contributing

> Contributions are welcome! Please read `tsen-back/readme.md` and `tsen-front/readme.md` for detailed guidelines.

## License

> This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Author

> Developed by [blue-orion](https://github.com/blue-orion)  
> Portfolio: [https://your-portfolio.example.com](https://your-portfolio.example.com)

## 한국어 버전 (한글판)

# PongService
실시간 멀티플레이 Pong 게임 서비스로, 로비 생성, 매칭, 실시간 플레이를 지원합니다.

![빌드 상태](https://img.shields.io/badge/build-passing-brightgreen)
![커버리지](https://img.shields.io/badge/coverage-95%25-brightgreen)
![라이선스](https://img.shields.io/badge/license-MIT-blue)

## 목차
1. [개요](#개요)
2. [주요 기능](#주요-기능)
3. [아키텍처](#아키텍처)
4. [기술 스택](#기술-스택)
5. [시작하기](#시작하기)
   - [필수 요구사항](#필수-요구사항)
   - [설치](#설치)
   - [환경 설정](#환경-설정)
   - [앱 실행](#앱-실행)
6. [API 참고](#api-참고)
7. [테스트](#테스트)
8. [기여](#기여)
9. [라이선스](#라이선스)
10. [저자](#저자)

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

![아키텍처 다이어그램](./nginx/architecture.png)

- **백엔드**: Node.js, Fastify, Prisma, WebSocket 관리
- **데이터베이스**: SQLite (Prisma로 관리)
- **프론트엔드**: Vite, TypeScript, Tailwind CSS
- **배포**: Docker, Docker Compose, Nginx 리버스 프록시

## 기술 스택

| 계층       | 기술                                     |
| :--------- | :--------------------------------------- |
| 백엔드     | Node.js, Fastify, Prisma, WebSocket      |
| 데이터베이스 | SQLite (Prisma)                         |
| 프론트엔드 | Vite, TypeScript, (Vue/React)            |
| 스타일링   | Tailwind CSS                             |
| 테스트     | Jest (백엔드), Vitest (프론트엔드)        |
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

## 테스트

### 백엔드 테스트
```bash
cd tsen-back
npm test
```

### 프론트엔드 테스트
```bash
cd tsen-front
npm test
```

## 기여

> 기여는 환영합니다! 자세한 가이드라인은 `tsen-back/readme.md` 및 `tsen-front/readme.md`를 참고하세요.

## 라이선스

> 이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](./LICENSE) 파일을 참조하세요.

## 저자

> 개발자 [blue-orion](https://github.com/blue-orion)  
> 포트폴리오: [https://your-portfolio.example.com](https://your-portfolio.example.com)