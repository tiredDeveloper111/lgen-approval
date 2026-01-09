import { Config } from './config';
import { SOAPClientFactory } from './client_factory';
import { APPR_TYPE, RequestAuto } from './clients/approval_register_client';

/**
 * 사용 예시 1: Factory 패턴 사용
 */
async function exampleWithFactory() {
  const config = Config.getConfig();

  // Factory 설정
  const factory = new SOAPClientFactory({
    approvalRegister: {
      wsdlPathOrUrl: config.url.wsdl,
      endpoint: config.url.endpoint,
      username: 'SPI_APRV_01',
      password: 'lgchem2016',
    },
    // 다른 클라이언트 추가 가능
    // approvalCancel: {
    //   wsdlPathOrUrl: 'http://example.com/cancel.wsdl',
    //   endpoint: 'http://example.com/cancel',
    //   username: 'username',
    //   password: 'password',
    // },
  });

  // 전자결재 기안 클라이언트 사용
  const registerClient = await factory.getApprovalRegisterClient();

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

  const response = await registerClient.execute([requestData]);
  console.log('결재 기안 결과:', response);

  // 다른 클라이언트 사용 예시
  // const cancelClient = await factory.getApprovalCancelClient();
  // const cancelResult = await cancelClient.execute([{ APPR_DOC_NO: '123', REQ_USER: 'user' }]);
}

/**
 * 사용 예시 2: 개별 클라이언트 직접 사용
 */
async function exampleDirectClient() {
  const config = Config.getConfig();

  const { ApprovalRegisterClient } = await import('./clients/approval_register_client');

  const client = new ApprovalRegisterClient({
    wsdlPathOrUrl: config.url.wsdl,
    endpoint: config.url.endpoint,
    username: 'SPI_APRV_01',
    password: 'lgchem2016',
  });

  await client.initialize();

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

  // 여러 건 전송
  const response = await client.execute([requestData]);
  console.log('여러 건 결과:', response);

  // 단일 건 전송
  const singleResponse = await client.sendSingle(requestData);
  console.log('단일 건 결과:', singleResponse);
}

/**
 * 사용 예시 3: 여러 클라이언트 병렬 사용
 */
async function exampleMultipleClients() {
  const config = Config.getConfig();

  const factory = new SOAPClientFactory({
    approvalRegister: {
      wsdlPathOrUrl: config.url.wsdl,
      endpoint: config.url.endpoint,
      username: 'SPI_APRV_01',
      password: 'lgchem2016',
    },
    // approvalCancel: { ... }
  });

  // 모든 클라이언트 한번에 초기화
  await factory.initializeAll();

  // 병렬로 여러 API 호출
  const [registerClient] = await Promise.all([
    factory.getApprovalRegisterClient(),
    // factory.getApprovalCancelClient(),
  ]);

  const requestData: RequestAuto = {
    APPKEY_01: 'test-somansa-001',
    SYSTEM_ID: 'BMIL',
    NEXT_APPR_TYPE: `${APPR_TYPE.APPROVAL}`,
    NEXT_APPROVER: 'FP508391',
  };

  const result = await registerClient.execute([requestData]);
  console.log('병렬 처리 결과:', result);
}

// 실행
if (require.main === module) {
  exampleWithFactory().catch(console.error);
}

export { exampleWithFactory, exampleDirectClient, exampleMultipleClients };

