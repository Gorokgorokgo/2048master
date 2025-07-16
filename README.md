# 2048 AI 어시스턴트

CleanArchitecture를 기반으로 한 TypeScript 2048 게임 AI 어시스턴트입니다. 고급 전략을 사용하여 자동으로 2048을 플레이하며, 4번째 행 우선 전략으로 일관되게 2048 달성 및 그 이상을 목표로 합니다.

## 📋 주요 기능

- **4번째 행 우선 전략**: 하단 행(1>2>3>4) 패턴 구축에 집중
- **스마트 평가 알고리즘**: 가중치 기반 실시간 보드 상태 분석
- **고급 병합 감지**: 고가치 병합과 최적 위치 우선순위 결정
- **속도 최적화**: 빠른 게임플레이를 위한 최소 지연
- **웹 통합**: Selenium WebDriver를 사용한 play2048.co 플레이
- **지속적 결과**: 최종 보드 상태 확인을 위해 브라우저 유지

## 🚀 빠른 시작

### 필수 요구사항

- Node.js (v14 이상)
- Chrome 브라우저

### 설치 및 실행

```bash
# 의존성 설치
npm install

# AI 실행 (권장)
npm run web-ai
```

### 대체 실행 방법

```bash
# 수동 빌드 + 실행
npm run build
node dist/web-ai-player.js

# 개발 모드
npm run dev
```

## 🎮 작동 원리

1. **브라우저 실행**: Chrome을 열고 play2048.co로 이동
2. **게임 감지**: 자동으로 게임을 감지하고 시작
3. **AI 전략**: 4번째 행 우선 알고리즘과 스마트 평가 사용
4. **실시간 플레이**: 보드 분석을 기반으로 최적의 움직임 수행
5. **결과 표시**: 최종 점수를 보여주고 검토를 위해 브라우저 유지

## 🧠 AI 전략

AI는 정교한 평가 시스템을 사용합니다:

### 핵심 전략

- **4번째 행 우선순위**: 하단 행(1-2-3-4)에 최대 우선순위 부여
- **3번째 행 보조**: 5-6-7-8 패턴에 두 번째 우선순위
- **내림차순 패턴**: 왼쪽에 더 큰 타일 유지

### 평가 기준

- **빈 셀**: 더 많은 공간 = 더 높은 점수
- **병합 기회**: 인접한 동일 타일에 보너스 부여
- **행 집중**: 하단 행에 집중된 타일에 보상
- **방향 가중치**: 아래 > 왼쪽 > 오른쪽 > 위

### 점수 시스템

- 4번째 행 병합: 8배 보너스
- 3번째→4번째 행 병합: 6배 보너스
- 패턴 위반: 심한 페널티
- 모서리 위치: 최대 타일 보너스

## 🎯 제어 방법

AI 실행 중:

- **브라우저 유지**: 게임 진행 상황 확인
- **Ctrl+C**: AI 중지 및 브라우저 종료
- **콘솔 로그**: 1000번마다 움직임과 점수 추적

## 📊 예상 성능

- **2048 달성**: 최적화된 전략으로 높은 성공률
- **속도**: 초당 약 1-2번 움직임
- **최대 타일**: 정기적으로 1024+ 달성, 2048+ 목표
- **게임 길이**: 2048 도달까지 일반적으로 1000-3000번 움직임

## 🏗️ 아키텍처

```
src/
├── domain/                 # 핵심 게임 로직과 규칙
│   ├── GameBoardImpl.ts   # 보드 상태 관리
│   ├── GameRules.ts       # 게임 규칙 및 검증
│   └── types.ts           # 타입 정의
├── application/           # 애플리케이션 서비스
├── infrastructure/        # 외부 통합
│   └── WebGameController.ts # Selenium 웹 자동화
├── presentation/          # 프레젠테이션 레이어
├── simple-ai.ts          # 기본 AI 구현
├── advanced-ai.ts        # 고급 AI 구현
├── expectimax-ai.ts      # Expectimax 알고리즘 AI
└── web-ai-player.ts      # 메인 AI 구현
```

## 🛠️ 개발

```bash
# TypeScript 빌드
npm run build

# 테스트 실행
npm test

# 타입 검사
npm run typecheck

# 개발용 감시 모드
npm run dev
```

### 추가 스크립트

```bash
# 대화형 게임 플레이
npm run play

# AI 데모
npm run ai-demo
npm run ai-advanced
npm run ai-expectimax

# 코드 품질
npm run lint
npm run lint:fix
npm run format
```

## 🔧 문제 해결

- **Chrome을 찾을 수 없음**: Chrome 브라우저가 설치되어 있는지 확인
- **게임이 로드되지 않음**: play2048.co 인터넷 연결 확인
- **AI가 멈춤**: 게임 감지 실패 시 브라우저 로그 확인
- **느린 성능**: 시스템 리소스 확인, AI는 CPU 집약적

## 🧪 테스트

```bash
# 전체 테스트
npm test

# 감시 모드
npm run test:watch

# 커버리지 확인
npm run test:coverage
```
