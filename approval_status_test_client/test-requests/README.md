# 테스트 요청 JSON 파일

이 디렉토리에는 SOAP 테스트 클라이언트에서 사용할 수 있는 요청 데이터 JSON 파일들이 포함되어 있습니다.

## 📁 파일 목록

| 파일 | 설명 | API_TYPE | RESULT |
|------|------|----------|--------|
| `approve-test.json` | 결재 승인 테스트 | A01 | APPROVE |
| `reject-test.json` | 결재 반려 테스트 | A01 | REJECT |
| `complete-test.json` | 최종 완료 테스트 | A01 | COMPLETE |
| `appr-line-update-test.json` | 결재선 수정 테스트 | A02 | - |

## 🚀 사용법

### 기본 사용법

```bash
# 위치 인자 방식
yarn test <호스트> <포트> <JSON파일경로>

# 옵션 방식
yarn test --host <호스트> --port <포트> --request-file <JSON파일경로>
```

### 사용 예시

#### 1. 로컬 서버 테스트 (위치 인자)

```bash
# 승인 테스트
yarn test localhost 8081 ./test-requests/approve-test.json

# 반려 테스트
yarn test localhost 8081 ./test-requests/reject-test.json

# 완료 테스트
yarn test localhost 8081 ./test-requests/complete-test.json
```

#### 2. 개발 서버 테스트 (옵션 방식)

```bash
yarn test --host dev-server.example.com --port 8081 -r ./test-requests/approve-test.json
```

#### 3. 운영 서버 테스트

```bash
yarn test 10.94.23.4 8081 ./test-requests/approve-test.json
```

#### 4. 절대 경로 사용

```bash
yarn test localhost 8081 /Users/qa/test-data/custom-test.json
```

## 📝 JSON 파일 형식

요청 JSON 파일은 다음과 같은 형식을 따라야 합니다:

```json
{
  "API_TYPE": "A01",
  "SYSTEM_ID": "BMIL",
  "APPKEY_01": "unique-request-id",
  "APPKEY_02": "",
  "APPKEY_03": "",
  "APPKEY_04": "",
  "APPKEY_05": "",
  "APPKEY_06": "",
  "APPROVER": "FP508391",
  "COMMENT_UTF8": "승인합니다.",
  "COMMENT_EUCKR": "",
  "RESULT": "APPROVE",
  "NEXT_APPR_TYPE": "",
  "NEXT_APPROVER_ORDER": "",
  "NEXT_APPROVER": "",
  "READ_USER": "",
  "APPR_DATE": "20260114150000"
}
```

### 필수 필드

모든 필드는 **필수**입니다. 사용하지 않는 필드는 빈 문자열(`""`)로 설정하세요.

### 주요 필드 설명

#### API_TYPE
- `A01`: 결재상태 처리
- `A02`: 결재선 수정

#### RESULT (A01인 경우)
- `APPROVE`: 승인
- `REJECT`: 반려
- `COMPLETE`: 최종완료
- `AGREE`: 합의(합의완료)
- `DISAGREE`: 합의(합의거부)
- `OK`: 협의(찬성)
- `NO`: 협의(반대)
- `CANCEL`: 결재취소
- `REVIEW`: 검토

#### APPR_DATE
- 형식: `yyyyMMddhhmmss`
- 예시: `20260114150000` (2026년 1월 14일 15시 00분 00초)

#### NEXT_APPR_TYPE (A02인 경우)
결재 타입을 세미콜론(`;`)으로 구분:
- `0`: 결재
- `1`: 협의(필수)
- `2`: 협의(선택)
- `6`: 합의
- `7`: 보고
- `8`: 투자담당
- `9`: 자가승인
- `10`: 병렬합의

예시: `0;2;1;0;9`

## 🛠️ 새로운 테스트 케이스 만들기

1. 이 디렉토리에 새로운 JSON 파일 생성
2. 위의 형식에 맞춰 데이터 작성
3. 테스트 실행

```bash
# 새로운 테스트 케이스로 테스트
yarn test localhost 8081 ./test-requests/my-custom-test.json
```

## 💡 팁

### 다양한 환경 테스트

환경별로 별도의 디렉토리를 만들어 관리할 수 있습니다:

```
test-requests/
  ├── dev/
  │   ├── approve-test.json
  │   └── reject-test.json
  ├── staging/
  │   ├── approve-test.json
  │   └── reject-test.json
  └── prod/
      ├── approve-test.json
      └── reject-test.json
```

### 배치 테스트

여러 테스트를 순차적으로 실행:

```bash
#!/bin/bash
# batch-test.sh

HOST="localhost"
PORT="8081"

echo "=== 배치 테스트 시작 ==="

for file in ./test-requests/*.json; do
  echo ""
  echo "테스트: $file"
  yarn test $HOST $PORT $file
  if [ $? -ne 0 ]; then
    echo "❌ 테스트 실패: $file"
    exit 1
  fi
done

echo ""
echo "=== 모든 테스트 성공 ==="
```

실행:
```bash
chmod +x batch-test.sh
./batch-test.sh
```

## 🔍 테스트 결과 확인

테스트 실행 시 다음 정보가 출력됩니다:
- 서버 정보 (Host, Port)
- 로드된 요청 데이터
- SOAP 서비스 정보
- 요청/응답 데이터
- 테스트 성공/실패 여부

성공 예시:
```
✅ 테스트 성공: 결재상태 처리가 완료되었습니다.
```

실패 예시:
```
❌ 테스트 실패: 지원하지 않는 API_TYPE: INVALID_TYPE
```

## 📞 문의

테스트 관련 문의사항은 개발팀에게 연락하세요.


