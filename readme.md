### 프로젝트 요구사항

- `node` 22.17.0

  > Red Hat build of Node.js 22 introduces an experimental feature for a built-in **node:sqlite** module that you can enable by using the --experimental-sqlite CLI flag.

  > Red Hat build of Node.js 22 includes an experimental built-in browser-compatible implementation of the **WebSocket API**. This enhancement provides a WebSocket client without external dependencies.

  22버전부터 `sqlite`와 `WebSocket`이 내장으로 지원됨

- `fastify` 4.29.1

  npm 다운로드 가장 많은 버전

  node 22 버전도 공식 지원함

---

1. nvm 설치

   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
   ```

2. 터미널 재시작 혹은 로딩

   ```bash
   source ~/.bashrc  # 또는 ~/.zshrc, ~/.profile
   ```

3. node 설치

   ```bash
   nvm install 22
   nvm use 22
   # 기본 버전으로 설정
   nvm alias default 22

   # node 버전 확인
   node -v
   npm -v
   ```

4. npm 설치

   ```bash
   # package.json 이 존재하는 프로젝트 루트에서
   npm install

   # 실행
   npm run dev  # package.json에 선언된 스크립트 실행
   npm start    # 시작 예약어, 'npm run start' 와 동일
   ```
