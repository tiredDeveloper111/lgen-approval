# SOAP 클라이언트 아키텍처

## 📁 프로젝트 구조

```
src/
├── base_soap_client.ts           # Base SOAP Client (공통 로직)
├── client_factory.ts              # Client Factory (클라이언트 관리)
├── clients/
│   ├── index.ts                   # Export 모듈
│   ├── approval_register_client.ts # 전자결재 기안 클라이언트
│   └── approval_cancel_client.ts   # 전자결재 취소 클라이언트 (예시)
├── config.ts                      # 설정 관리
├── index.ts                       # 메인 진입점
└── example_usage.ts              # 사용 예시
```

## 🎯 설계 원칙

### 1. Base Client Pattern
- **BaseSOAPClient**: 모든 SOAP 클라이언트의 공통 로직 (초기화, 인증, 에러 처리)
- Generic 타입으로 요청/응답 타입 안정성 보장

### 2. 각 API별 구체 클라이언트
- 각 WSDL마다 별도의 클라이언트 클래스 생성
- BaseSOAPClient를 상속받아 구현
- 각 API에 특화된 타입과 메서드 제공

### 3. Factory Pattern
- 여러 클라이언트를 중앙에서 관리
- 싱글톤 방식으로 인스턴스 재사용
- 초기화 지연 로딩

## 🚀 사용 방법

### 방법 1: Factory 패턴 (권장)

```typescript
import { SOAPClientFactory } from './client_factory';
import { APPR_TYPE } from './clients';

// Factory 설정
const factory = new SOAPClientFactory({
  approvalRegister: {
    wsdlPathOrUrl: 'http://example.com/approval.wsdl',
    endpoint: 'http://example.com/approval',
    username: 'user',
    password: 'pass',
  },
  approvalCancel: {
    wsdlPathOrUrl: 'http://example.com/cancel.wsdl',
    endpoint: 'http://example.com/cancel',
    username: 'user',
    password: 'pass',
  },
});

// 클라이언트 사용
const registerClient = await factory.getApprovalRegisterClient();
const response = await registerClient.execute([{
  APPKEY_01: 'key-001',
  SYSTEM_ID: 'SYSTEM',
  NEXT_APPR_TYPE: `${APPR_TYPE.APPROVAL}`,
  NEXT_APPROVER: 'user1',
}]);
```

### 방법 2: 개별 클라이언트 직접 사용

```typescript
import { ApprovalRegisterClient } from './clients';

const client = new ApprovalRegisterClient({
  wsdlPathOrUrl: 'http://example.com/approval.wsdl',
  endpoint: 'http://example.com/approval',
  username: 'user',
  password: 'pass',
});

await client.initialize();

const response = await client.sendSingle({
  APPKEY_01: 'key-001',
  SYSTEM_ID: 'SYSTEM',
  NEXT_APPR_TYPE: '0',
  NEXT_APPROVER: 'user1',
});
```

## 📝 새로운 WSDL 클라이언트 추가하기

### 1단계: 클라이언트 클래스 생성

```typescript
// src/clients/new_api_client.ts
import { BaseSOAPClient, SOAPClientConfig } from '../base_soap_client';

export interface NewApiRequest {
  // 요청 타입 정의
}

export interface NewApiResponse {
  // 응답 타입 정의
}

export class NewApiClient extends BaseSOAPClient<NewApiRequest, NewApiResponse> {
  constructor(config: SOAPClientConfig) {
    super(config);
  }

  getClientName(): string {
    return 'NewApi';
  }

  async execute(request: NewApiRequest): Promise<NewApiResponse> {
    this.ensureInitialized();
    
    try {
      // SOAP 메서드 호출
      const [result] = await this.client!.YourSOAPMethodAsync(request);
      return result as NewApiResponse;
    } catch (error) {
      console.error(`[${this.getClientName()}] 오류:`, error);
      throw error;
    }
  }
}
```

### 2단계: Factory에 추가

```typescript
// src/client_factory.ts
export interface ClientFactoryConfig {
  approvalRegister: SOAPClientConfig;
  approvalCancel?: SOAPClientConfig;
  newApi?: SOAPClientConfig; // 추가
}

export class SOAPClientFactory {
  // ...
  
  async getNewApiClient(): Promise<NewApiClient> {
    const key = 'newApi';
    
    if (!this.config.newApi) {
      throw new Error('NewApi 클라이언트 설정이 없습니다.');
    }
    
    if (!SOAPClientFactory.instances.has(key)) {
      const client = new NewApiClient(this.config.newApi);
      await client.initialize();
      SOAPClientFactory.instances.set(key, client);
    }
    
    return SOAPClientFactory.instances.get(key)!;
  }
}
```

### 3단계: Export 추가

```typescript
// src/clients/index.ts
export { NewApiClient, NewApiRequest, NewApiResponse } from './new_api_client';
```

## ✅ 장점

1. **확장성**: 새로운 WSDL 추가가 쉬움
2. **재사용성**: 공통 로직을 Base Client에서 관리
3. **타입 안정성**: TypeScript Generic으로 타입 보장
4. **유지보수성**: 각 API가 독립적으로 관리됨
5. **성능**: Factory 패턴으로 인스턴스 재사용
6. **테스트**: 각 클라이언트를 독립적으로 테스트 가능

## 🔧 설정

`config.yaml`:
```yaml
url:
  wsdl: http://example.com/approval.wsdl
  endpoint: http://example.com/approval
mgmt:
  ip: 127.0.0.1
  port: 8000
```

## 📊 비교: 기존 vs 새로운 구조

### 기존 구조 (단일 클라이언트)
```typescript
// ❌ 각 WSDL마다 전체 코드 복사/수정 필요
// ❌ 공통 로직 중복
// ❌ 유지보수 어려움
const client = new ApprovalClient(wsdl, endpoint);
await client.initialize();
await client.sendApprovalRequest(data);
```

### 새로운 구조 (확장 가능)
```typescript
// ✅ Base Client 상속으로 공통 로직 재사용
// ✅ 각 API에 특화된 타입과 메서드
// ✅ Factory로 중앙 관리
const factory = new SOAPClientFactory(config);
const client = await factory.getApprovalRegisterClient();
await client.execute(data);
```

## 🎓 Best Practices

1. **Base Client 수정 최소화**: 공통 로직만 포함
2. **각 클라이언트는 독립적**: API별 특수 로직은 각 클라이언트에
3. **Factory 사용**: 여러 클라이언트를 사용할 때는 Factory 활용
4. **타입 정의**: 요청/응답 타입을 명확히 정의
5. **에러 처리**: 각 클라이언트에서 적절한 에러 처리

