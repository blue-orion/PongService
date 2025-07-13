## Transcendence Backend

### 기술 스택

- `Node.js` 20.19.3

  최신 lts 이전 버전, 자료가 많음

- `Fastify` 4.29.1

  경량 웹 프레임워크

  npm 다운로드 가장 많은 버전

- `Prisma` 6.11.1

  가장 인기있는 Node.js 진영 ORM 패키지

  npm 다운로드 가장 많은 버전

---

### vscode extensions

- `ESLint @Microsoft`

  자바스크립트 문법 검사기

- `Prettier - Code formatter @Prettier`

  코드 스타일 포맷터

  ctrl(cmd) + k + (k 떼고) f 수행 후 포맷팅 방식 prettier로 변경

  vscode 설정에서 _format on save_ **true** 설정

  vscode 설정에서 _prettier.width_ **120** 설정

  vscode 설정에서 _rulers_ **120** 설정

---

### 프로젝트 구조

```text
root
├── prisma
│   ├── schema.prisma       # 데이터베이스 스키마
│   └── transcendence.db    # SQLite
│
├── src
│   ├── domains
│   │   └── {domain}        # 각각의 도메인별 폴더로 세부 구분
│   │       ├── {domain}Routes.js
│   │       ├── controller
│   │       │   └── {domain}Controller.js
│   │       ├── model
│   │       │   └── ...
│   │       ├── repo
│   │       │   └── {domain}Repo.js
│   │       └── service
│   │           └── {domain}Service.js
│   │
│   ├── routes
│   │   └── index.js        # 도메인별 라우팅 경로 통합
│   │
│   ├── shared
│   │   ├── api
│   │   │   └── response.js # 기본 Http 응답 포멧
│   │   ├── config
│   │   │   └── index.js    # 서버 설정
│   │   └── database
│   │       └── prisma.js   # Prisma 연결 클라이언트
│   │
│   ├── env.js      # 배포 환경 설정 파일 로드
│   └── server.js   # 서버 루트 파일
│
├── eslint.config.js
└── package.json
```

- controller

  - http request, http response 담당 영역
  - request 에서 데이터를 가공하여 service 로 전달
  - service 의 수행 결과를 response 로 리턴

- service

  - 기능별 메인 로직이 수행되는 영역
  - controller 에서 넘어온 데이터를 바탕으로 비즈니스 로직 수행
  - 데이터베이스가 필요한 경우 repository를 호출

- repository

  - 데이터베이스 조회를 담당하는 영역

- model

  - 각각의 계층별로 전달되는 데이터 타입 정의

---

### HOW TO RUN

1. nvm 설치

   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
   ```

2. 터미널 재시작 혹은 로딩

   ```bash
   source ~/.zshrc  # 또는 ~/.bashrc, ~/.profile
   ```

3. node 설치

   ```bash
   nvm install 20
   nvm use 20
   nvm alias default 20 # 기본 버전으로 설정

   # node 버전 확인
   node -v
   npm -v
   ```

4. 실행

   ```bash
   # package.json 이 존재하는 프로젝트 루트에서
   npm install

   # 실행
   npm run dev # package.json에 선언된 스크립트 실행
   npm start # 시작 예약어, 'npm run start' 와 동일
   ```
   