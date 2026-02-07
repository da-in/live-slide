# live-slide
발표 자료를 준비하기 싫어요

pnpm 모노레포로 구성되어 있습니다.

## 설치

```bash
pnpm install
```

## 실행 방법

### 동시 실행 (클라이언트 + 서버)
```bash
pnpm dev
```

### 개별 실행

**서버 (백엔드)**
```bash
pnpm dev:server
```
→ `http://localhost:8000` 에서 HTTP + WebSocket 대기. 터미널에 `[TRANSCRIPT]` 로그 출력.

**클라이언트 (프론트)**
```bash
pnpm dev:client
```
→ `http://localhost:3000` 접속 후 **마이크 켜기**로 STT → 서버로 전사 텍스트 전송. 서버 터미널에서 로그 확인.

### 기타 스크립트
- `pnpm build` - 클라이언트 빌드
- `pnpm lint` - 클라이언트 린트
- `pnpm start` - 서버 프로덕션 실행
- `pnpm start:client` - 클라이언트 프로덕션 실행
