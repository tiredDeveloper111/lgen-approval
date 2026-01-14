# approval_status_test_client

`prototype/approval_server`에 있던 **결재상태 처리 SOAP 테스트 클라이언트**(`test_client.ts`, `approval_status_client.ts`)만 분리한 독립 실행 프로젝트입니다.

## 실행

1) 의존성 설치

```bash
cd approval_status_test_client
yarn
```

2) 테스트 실행 (ts-node 불필요)

```bash
# 내부적으로 tsc 빌드 후(node로 dist 실행) 테스트합니다.
yarn test --host <호스트> --port <포트> -r <요청JSON파일경로>
```

또는 위치 인자로:

```bash
yarn test <호스트> <포트> <요청JSON파일경로>
```

예시:

```bash
cd approval_status_test_client
yarn test localhost 8081 ./test-requests/approve-test.json
```

3) (선택) 순수 node로 직접 실행

```bash
yarn build
node dist/test/test_client.js localhost 8081 ./test-requests/approve-test.json
```

## 요청 JSON 형식

- `src/types/approval_status_types.ts`의 `ApprovalStatusRequest`를 참고하세요.


