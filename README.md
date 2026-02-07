# live-slide
발표 자료를 준비하기 싫어요

## 실행 방법

### 1. 서버 (백엔드)
```bash
cd server
npm install
npm run dev
```
→ `http://localhost:8000` 에서 HTTP + WebSocket 대기. 터미널에 `[TRANSCRIPT]` 로그 출력.

### 2. 클라이언트 (프론트)
```bash
cd client
npm install
npm run dev
```
→ `http://localhost:3000` 접속 후 **마이크 켜기**로 STT → 서버로 전사 텍스트 전송. 서버 터미널에서 로그 확인.
