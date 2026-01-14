# 결재상태 처리 SOAP 클라이언트 테스트 가이드

## 📋 개요

approval_server에 요청을 보내는 테스트 클라이언트입니다.

## 🚀 빠른 시작

### 1. 서버 실행 (터미널 1)

```bash
cd prototype/approval_server
yarn dev
```

서버가 실행되면:
- `http://localhost:8000/approval-status` - SOAP Endpoint
- `http://localhost:8000/approval-status?wsdl` - WSDL

### 2. 테스트 클라이언트 실행 (터미널 2)

```bash
cd prototype/approval_server
yarn test
```

## 📁 파일 구조

```
src/test/
├── approval_status_client.ts  # SOAP 클라이언트
└── test_client.ts             # 테스트 스크립트
```

## 🧪 테스트 시나리오

### 테스트 1: 결재 승인 (APPROVE)
```typescript
await client.approve('BMIL', 'FP508391;FP508932', '승인합니다.');
```

### 테스트 2: 결재 반려 (REJECT)
```typescript
await client.reject('BMIL', 'FP508391', '수정이 필요합니다.');
```

### 테스트 3: 최종 완료 (COMPLETE)
```typescript
await client.complete('BMIL', 'FP508391', '최종 승인 완료');
```

### 테스트 4: 합의 완료 (AGREE)
```typescript
await client.processApprovalStatus({
  API_TYPE: 'A01',
  SYSTEM_ID: 'BMIL',
  APPROVER: 'FP508932',
  RESULT: 'AGREE',
  COMMENT_UTF8: '합의합니다.',
});
```

### 테스트 5: 결재선 수정 (A02)
```typescript
await client.updateApprovalLine(
  'BMIL',
  ['0', '2', '1', '0', '9'],  // 결재타입
  ['FP001', 'FP002', 'FP003', 'FP004', 'FP005'],  // 결재자
  ['부장', '과장', '대리', '사원', '본인']  // 결재자명
);
```

### 테스트 6: 다양한 결재 결과
- OK (협의 찬성)
- NO (협의 반대)
- DISAGREE (합의 거부)
- CANCEL (결재 취소)
- REVIEW (검토)

### 테스트 7: 에러 케이스
필수 값 누락 시 에러 처리 확인

## 🎯 클라이언트 사용법

### 기본 사용

```typescript
import { ApprovalStatusClient } from './test/approval_status_client';

// 클라이언트 생성
const client = new ApprovalStatusClient(
  'http://localhost:8000/approval-status?wsdl',
  'http://localhost:8000/approval-status'
);

// 초기화
await client.initialize();

// 요청 전송
const response = await client.processApprovalStatus({
  API_TYPE: 'A01',
  SYSTEM_ID: 'BMIL',
  APPROVER: 'FP508391',
  RESULT: 'APPROVE',
  COMMENT_UTF8: '승인합니다.'
});

console.log(response);
// {
//   IF_STATUS: 'S',
//   IF_ERRMSG: '결재상태 처리가 완료되었습니다.'
// }
```

### 편의 메서드

#### 1. 승인
```typescript
const response = await client.approve(
  'BMIL',           // SYSTEM_ID
  'FP508391',       // APPROVER
  '승인합니다.'      // COMMENT (optional)
);
```

#### 2. 반려
```typescript
const response = await client.reject(
  'BMIL',
  'FP508391',
  '수정이 필요합니다.'
);
```

#### 3. 완료
```typescript
const response = await client.complete(
  'BMIL',
  'FP508391',
  '최종 승인'
);
```

#### 4. 결재선 수정
```typescript
const response = await client.updateApprovalLine(
  'BMIL',                                    // SYSTEM_ID
  ['0', '2', '1', '0', '9'],                // 결재타입
  ['FP001', 'FP002', 'FP003', 'FP004', 'FP005'],  // 결재자 사번
  ['부장', '과장', '대리', '사원', '본인']        // 결재자명 (optional)
);
```

## 📊 응답 형식

모든 응답은 다음 형식을 따릅니다:

```typescript
{
  IF_STATUS: 'S' | 'E',  // S: 성공, E: 실패
  IF_ERRMSG: string      // 성공/에러 메시지
}
```

### 성공 예시
```json
{
  "IF_STATUS": "S",
  "IF_ERRMSG": "결재상태 처리가 완료되었습니다."
}
```

### 실패 예시
```json
{
  "IF_STATUS": "E",
  "IF_ERRMSG": "APPROVER는 필수입니다."
}
```

## 🔧 커스텀 테스트 작성

새로운 테스트를 추가하려면:

```typescript
// src/test/my_custom_test.ts
import { ApprovalStatusClient } from './approval_status_client';

async function customTest() {
  const client = new ApprovalStatusClient(
    'http://localhost:8000/approval-status?wsdl',
    'http://localhost:8000/approval-status'
  );
  
  await client.initialize();
  
  // 커스텀 테스트 로직
  const response = await client.processApprovalStatus({
    API_TYPE: 'A01',
    SYSTEM_ID: 'MY_SYSTEM',
    APPROVER: 'USER001',
    RESULT: 'APPROVE',
  });
  
  console.log(response);
}

customTest();
```

실행:
```bash
ts-node src/test/my_custom_test.ts
```

## 🐛 디버깅

### 서버 로그 확인
서버 터미널에서 실시간 로그를 확인할 수 있습니다:
```
========================================
SOAP 요청 수신
========================================

=== 결재상태 처리 요청 수신 ===
{
  "API_TYPE": "A01",
  "SYSTEM_ID": "BMIL",
  ...
}
```

### 클라이언트 로그
클라이언트는 다음 정보를 출력합니다:
- 📤 요청 전송 내용
- 📥 응답 수신 내용
- ✅ 테스트 성공/실패 여부

## 💡 팁

1. **서버를 먼저 실행하세요**: 테스트 실행 전에 반드시 서버가 실행 중이어야 합니다.

2. **WSDL 확인**: 브라우저에서 `http://localhost:8000/approval-status?wsdl`로 WSDL을 확인할 수 있습니다.

3. **포트 변경**: config.yaml에서 포트를 변경한 경우, 테스트 클라이언트의 URL도 수정하세요.

4. **에러 처리**: 모든 요청은 try-catch로 감싸서 예외를 처리하세요.

## 🎓 다음 단계

1. 실제 비즈니스 로직 구현 (`src/services/approval_status_service.ts`)
2. 데이터베이스 연동
3. 인증/권한 검증 추가
4. 로깅 시스템 강화

