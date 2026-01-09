import { Config, ConfigReloader } from './config';
import { SOAPClientFactory } from './client_factory';
import { APPR_TYPE, RequestAuto } from './clients/approval_register_client';

async function main() {
  console.log('=== 전자결재 SOAP 클라이언트 시작 ===\n');

  const config = Config.getConfig();

  // Factory 설정
  const factory = new SOAPClientFactory({
    approvalRegister: {
      wsdlPathOrUrl: config.url.wsdl,
      endpoint: config.url.endpoint,
      username: 'SPI_APRV_01',
      password: 'lgchem2016',
    },
    // 추가 클라이언트 설정 가능
    // approvalCancel: {
    //   wsdlPathOrUrl: 'http://example.com/cancel.wsdl',
    //   endpoint: 'http://example.com/cancel',
    //   username: 'SPI_APRV_01',
    //   password: 'lgchem2016',
    // },
  });

  // 전자결재 기안 클라이언트 가져오기
  const registerClient = await factory.getApprovalRegisterClient();

  // 클라이언트 정보 출력
  registerClient.describeClient();

  // 요청 데이터 준비
  const requestData: RequestAuto = {
    APPKEY_01: 'test-somansa-001',
    SYSTEM_ID: 'BMIL',
    FORM_ID: 'BMIL-F00001',
    APPR_TITLE: '소만사 결재연동 테스트',
    REQ_USER: 'FP508391',
    APPR_SECURITY_TYPE: '0',
    NEXT_APPR_TYPE: `${APPR_TYPE.SELF};${APPR_TYPE.APPROVAL}`,
    NEXT_APPROVER: 'FP508391;FP508932',
  };

  console.log('\n=== 전자결재 기안 요청 ===');

  // 방법 1: 여러 건 전송
  const responses = await registerClient.execute([requestData]);
  console.log('\n[여러 건 전송 결과]');
  console.log(JSON.stringify(responses, null, 2));

  // 방법 2: 단일 건 전송 (편의 메서드)
  const singleResponse = await registerClient.sendSingle(requestData);
  console.log('\n[단일 건 전송 결과]');
  console.log(JSON.stringify(singleResponse, null, 2));

  // 결과 확인
  if (singleResponse.IF_STATUS === 'S') {
    console.log('\n✅ 전자결재 기안 성공!');
  } else {
    console.log('\n❌ 전자결재 기안 실패:', singleResponse.IF_ERRMSG);
  }

  console.log('\n=== Config Reloader 시작 ===');
  await ConfigReloader.start();
}

main().catch((e) => console.error('❌ 예상치 못한 오류:', e));
