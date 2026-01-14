# 결재상태 처리 SOAP 서버

전자결재 시스템의 결재상태 처리 및 결재선 수정을 위한 SOAP 웹 서비스 서버입니다.

## 🎯 기능

### A01: 결재상태 처리
- 승인 (APPROVE)
- 반려 (REJECT)
- 최종완료 (COMPLETE)
- 합의완료 (AGREE)
- 합의거부 (DISAGREE)
- 협의찬성 (OK)
- 협의반대 (NO)
- 결재취소 (CANCEL)
- 검토 (REVIEW)

### A02: 결재선 수정
- 결재선 타입 변경
- 결재자 변경
- 결재 순서 변경

## 📁 프로젝트 구조

```
approval_server/
├── src/
│   ├── types/
│   │   └── approval_status_types.ts   # 타입 정의
│   ├── services/
│   │   └── approval_status_service.ts # 비즈니스 로직
│   ├── soap_server.ts                 # SOAP 서버 설정
│   ├── config.ts                      # 설정 관리
│   └── index.ts                       # 진입점
├── approval_status.wsdl               # WSDL 정의
├── config.yaml                        # 서버 설정
├── package.json
└── tsconfig.json
```

## 🚀 시작하기

### 1. 의존성 설치

```bash
yarn install
# 또는
npm install
```

### 2. 설정 파일 수정

`config.yaml`:
```yaml
server:
  host: 0.0.0.0
  port: 8000
vsmgmt:
  host: 127.0.0.1
  port: 8000
wsdl:
  path: ./approval_status.wsdl
```

### 3. 서버 실행

```bash
# 개발 모드
yarn dev

# 프로덕션 모드
yarn build
yarn start
```

## 📡 API 사용법

### 엔드포인트

- **SOAP Endpoint**: `http://localhost:8000/approval-status`
- **WSDL**: `http://localhost:8000/approval-status?wsdl`

### 요청 예시

#### A01: 결재상태 처리 (승인)

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://www.lgchem.com/ApprovalStatus">
  <soap:Body>
    <tns:processApprovalStatus>
      <API_TYPE>A01</API_TYPE>
      <SYSTEM_ID>BMIL</SYSTEM_ID>
      <APPROVER>FP508391;FP508932</APPROVER>
      <COMMENT_UTF8>승인합니다</COMMENT_UTF8>
      <RESULT>APPROVE</RESULT>
      <APPR_DATE>20260113150000</APPR_DATE>
    </tns:processApprovalStatus>
  </soap:Body>
</soap:Envelope>
```

#### A02: 결재선 수정

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://www.lgchem.com/ApprovalStatus">
  <soap:Body>
    <tns:processApprovalStatus>
      <API_TYPE>A02</API_TYPE>
      <SYSTEM_ID>BMIL</SYSTEM_ID>
      <NEXT_APPR_TYPE>0;2;1;0;9</NEXT_APPR_TYPE>
      <NEXT_APPROVER>FP508391;FP508932;FP508933;FP508934;FP508935</NEXT_APPROVER>
      <NEXT_APPROVER_ORDER>부장;과장;대리;사원;본인</NEXT_APPROVER_ORDER>
    </tns:processApprovalStatus>
  </soap:Body>
</soap:Envelope>
```

### 응답 예시

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <tns:processApprovalStatusResponse xmlns:tns="http://www.lgchem.com/ApprovalStatus">
      <IF_STATUS>S</IF_STATUS>
      <IF_ERRMSG>결재상태 처리가 완료되었습니다.</IF_ERRMSG>
    </tns:processApprovalStatusResponse>
  </soap:Body>
</soap:Envelope>
```

## 📋 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| API_TYPE | string | O | A01: 결재상태 처리, A02: 결재선 수정 |
| SYSTEM_ID | string | O | 시스템 ID (예: BMIL) |
| APPROVER | string | △ | 결재자 사번 (A01에서 필수) |
| COMMENT_UTF8 | string | X | 결재 의견 UTF8 |
| COMMENT_EUCKR | string | X | 결재 의견 EUCKR |
| RESULT | string | △ | 결재 결과 (A01에서 필수) |
| NEXT_APPR_TYPE | string | △ | 결재선 타입 (A02에서 필수) |
| NEXT_APPROVER_ORDER | string | X | 결재자 표시명 |
| NEXT_APPROVER | string | △ | 결재자 사번 (A02에서 필수) |
| READ_USER | string | X | 열람자 사번 |
| APPR_DATE | string | X | 결재처리일시 (yyyyMMddhhmmss) |

## 🔧 개발

### 타입 정의

`src/types/approval_status_types.ts`에서 모든 타입이 정의되어 있습니다.

### 비즈니스 로직 추가

`src/services/approval_status_service.ts`에서 실제 처리 로직을 구현하세요:

```typescript
private async handleStatusProcess(request: ApprovalStatusRequest) {
  // TODO: 실제 비즈니스 로직 구현
  // 1. 데이터베이스 조회
  // 2. 권한 검증
  // 3. 결재 처리
  // 4. 알림 발송
  
  return {
    IF_STATUS: 'S',
    IF_ERRMSG: '처리 완료'
  };
}
```

## 🧪 테스트

### 자동 테스트 실행

서버를 먼저 실행한 후:

```bash
# 터미널 1: 서버 실행
yarn dev

# 터미널 2: 테스트 클라이언트 실행
yarn test
```

### 수동 테스트

```typescript
import { ApprovalStatusClient } from './test/approval_status_client';

const client = new ApprovalStatusClient(
  'http://localhost:8000/approval-status?wsdl',
  'http://localhost:8000/approval-status'
);

await client.initialize();

// 승인 처리
const response = await client.approve('BMIL', 'FP508391', '승인합니다.');
console.log(response);

// 결재선 수정
const response2 = await client.updateApprovalLine(
  'BMIL',
  ['0', '2', '1', '0', '9'],
  ['FP001', 'FP002', 'FP003', 'FP004', 'FP005']
);
console.log(response2);
```

테스트 가이드: [TEST_CLIENT_GUIDE.md](./TEST_CLIENT_GUIDE.md)

## 📝 라이센스

MIT

