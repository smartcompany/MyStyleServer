# Ad Settings API Server

Next.js 기반의 광고 설정 관리 서버입니다.

## 기능

- 광고 설정 조회 및 업데이트 API
- 웹 기반 관리자 인터페이스
- 플랫폼별 광고 ID 관리 (iOS/Android)

## API 엔드포인트

### GET /api/settings
광고 설정을 조회합니다.

**응답 예시:**
```json
{
  "ios_ad": "initial_ad",
  "android_ad": "initial_ad",
  "ios_banner_ad": "banner_ad",
  "android_banner_ad": "banner_ad",
  "ref": {
    "ios": {
      "initial_ad": "ca-app-pub-5520596727761259/9323926836",
      "rewarded_ad": "ca-app-pub-5520596727761259/5241271661",
      "banner_ad": "ca-app-pub-5520596727761259/2440272873"
    },
    "android": {
      "initial_ad": "ca-app-pub-5520596727761259/7157620423",
      "rewarded_ad": "ca-app-pub-5520596727761259/3882705925",
      "banner_ad": "ca-app-pub-5520596727761259/7127862465"
    }
  }
}
```

### POST /api/settings
광고 설정을 업데이트합니다.

### GET /api/health
서버 상태를 확인합니다.

## 실행 방법

### 개발 서버 실행
```bash
npm run dev
```

### 특정 포트로 실행
```bash
npm run dev:port
```

### 프로덕션 빌드
```bash
npm run build
npm start
```

## 기술 스택

- Next.js 15
- TypeScript
- Tailwind CSS
- React 19

## 프로젝트 구조

```
server/
├── src/
│   └── app/
│       ├── api/
│       │   ├── settings/
│       │   │   └── route.ts
│       │   └── health/
│       │       └── route.ts
│       └── page.tsx
├── package.json
└── README.md
```# Force redeploy Sat Oct 11 14:52:38 KST 2025
