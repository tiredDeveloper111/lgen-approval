import { ApprovalStatusClient } from './approval_status_client';
import { ApprovalStatusRequest } from '../types/approval_status_types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 커맨드 라인 인자 파싱
 */
interface ParsedArgs {
  host: string;
  port: number;
  requestFile: string;
  help: boolean;
}

function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {
    host: 'localhost',
    port: 8081,
    requestFile: '',
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      result.help = true;
      return result;
    }

    if (arg === '--host') {
      result.host = args[++i];
    } else if (arg === '--port') {
      result.port = parseInt(args[++i], 10);
    } else if (arg === '-r' || arg === '--request-file') {
      result.requestFile = args[++i];
    } else if (i === 0 && !arg.startsWith('-')) {
      // 첫 번째 positional arg: host
      result.host = arg;
    } else if (i === 1 && !arg.startsWith('-')) {
      // 두 번째 positional arg: port
      result.port = parseInt(arg, 10);
    } else if (i === 2 && !arg.startsWith('-')) {
      // 세 번째 positional arg: request file
      result.requestFile = arg;
    }
  }

  return result;
}

/**
 * 사용법 출력
 */
function printUsage() {
  console.log('결재상태 처리 SOAP 테스트 클라이언트');
  console.log('');
  console.log('사용법 1 (옵션 형식):');
  console.log('  yarn test --host <호스트> --port <포트> --request-file <JSON파일경로>');
  console.log('  yarn test --host <호스트> --port <포트> -r <JSON파일경로>');
  console.log('');
  console.log('사용법 2 (위치 인자):');
  console.log('  yarn test <호스트> <포트> <JSON파일경로>');
  console.log('');
  console.log('예시:');
  console.log('  yarn test localhost 8081 ./test-requests/approve-test.json');
  console.log('  yarn test --host 10.94.23.4 --port 8081 -r ./test-requests/reject-test.json');
  console.log('  yarn test 127.0.0.1 8081 ./test-requests/complete-test.json');
  console.log('');
  console.log('옵션:');
  console.log('  --host <호스트>              SOAP 서버 호스트 (기본값: localhost)');
  console.log('  --port <포트>                SOAP 서버 포트 (기본값: 8081)');
  console.log('  -r, --request-file <경로>    요청 데이터 JSON 파일 경로 (필수)');
  console.log('  -h, --help                   도움말 출력');
  console.log('');
  console.log('요청 JSON 파일 형식:');
  console.log('  {');
  console.log('    "API_TYPE": "A01",');
  console.log('    "SYSTEM_ID": "BMIL",');
  console.log('    "APPKEY_01": "test-key-001",');
  console.log('    "APPKEY_02": "",');
  console.log('    ...');
  console.log('    "APPROVER": "FP508391",');
  console.log('    "RESULT": "APPROVE",');
  console.log('    "APPR_DATE": "20260114150000"');
  console.log('  }');
}

/**
 * 요청 JSON 파일 로드
 */
function loadRequestFile(filePath: string): ApprovalStatusRequest {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`요청 파일을 찾을 수 없습니다: ${absolutePath}`);
  }

  const content = fs.readFileSync(absolutePath, 'utf-8');
  try {
    return JSON.parse(content) as ApprovalStatusRequest;
  } catch (error) {
    throw new Error(`JSON 파싱 실패: ${(error as Error).message}`);
  }
}

/**
 * 테스트 클라이언트 메인
 */
async function main() {
  console.log('========================================');
  console.log('결재상태 처리 SOAP 클라이언트 테스트');
  console.log('========================================\n');

  // 커맨드 라인 인자 파싱
  const args = parseArgs(process.argv.slice(2));

  // 도움말 출력
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  // 필수 인자 검증
  if (!args.requestFile) {
    console.error('❌ 오류: 요청 파일 경로가 필요합니다.\n');
    printUsage();
    process.exit(1);
  }

  // 서버 정보 출력
  console.log('🌐 서버 정보:');
  console.log(`   Host: ${args.host}`);
  console.log(`   Port: ${args.port}`);
  console.log(`   Path: /approval-status`);
  console.log('');

  // 요청 파일 로드
  console.log('📄 요청 파일 로드:');
  console.log(`   파일: ${args.requestFile}`);

  let request: ApprovalStatusRequest;
  try {
    request = loadRequestFile(args.requestFile);
    console.log('   ✅ 로드 완료');
  } catch (error) {
    console.error(`   ❌ 로드 실패: ${(error as Error).message}`);
    process.exit(1);
  }

  console.log('');

  // 클라이언트 생성
  const wsdlUrl = `http://${args.host}:${args.port}/approval-status?wsdl`;
  const endpoint = `http://${args.host}:${args.port}/approval-status`;

  const client = new ApprovalStatusClient(wsdlUrl, endpoint);

  console.log('클라이언트 초기화 중...');
  console.log(`- WSDL: ${wsdlUrl}`);
  console.log(`- Endpoint: ${endpoint}`);

  // 초기화
  try {
    await client.initialize();
  } catch (error) {
    console.error('\n❌ 클라이언트 초기화 실패:', (error as Error).message);
    process.exit(1);
  }

  // 서비스 정보 출력
  client.describeClient();

  console.log('\n========================================');
  console.log('테스트 실행');
  console.log('========================================\n');

  // 요청 데이터 출력
  console.log('📤 요청 데이터:');
  console.log(JSON.stringify(request, null, 2));
  console.log('');

  // 테스트 실행
  try {
    const response = await client.processApprovalStatus(request);

    console.log('📥 응답 데이터:');
    console.log(JSON.stringify(response, null, 2));
    console.log('');

    if (response.IF_STATUS === 'S') {
      console.log('✅ 테스트 성공:', response.IF_ERRMSG);
      process.exit(0);
    } else {
      console.log('❌ 테스트 실패:', response.IF_ERRMSG);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 테스트 오류:', (error as Error).message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ 테스트 실행 중 오류:', error);
  process.exit(1);
});


