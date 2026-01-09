import { Config, ConfigReloader } from './config';
import { SOAPClientFactory } from './client_factory';
import { APPR_TYPE, RequestAuto } from './clients/approval_register_client';
import { API_TYPE, SetEntrustRequest } from './clients/approval_delegator_client';

async function main() {
  console.log('=== 전자결재 SOAP 클라이언트 시작 ===\n');

  const config = Config.getConfig();

  // Factory 설정
  const factory = new SOAPClientFactory({
    approvalRegister: {
      wsdlPathOrUrl: config.approval_register.wsdl,
      endpoint: config.approval_register.endpoint,
      username: config.account.username,
      password: config.account.password,
    },
    approvalDelegator: {
      wsdlPathOrUrl: config.approval_delegator.wsdl,
      endpoint: config.approval_delegator.endpoint,
      username: config.account.username,
      password: config.account.password,
    },
  });

  // =================================================================
  // 예시 1: 전자결재 기안 (Register)
  // =================================================================
  console.log('\n=== [예시 1] 전자결재 기안 (Register) ===');

  const registerClient = await factory.getApprovalRegisterClient();
  registerClient.describeClient();

  const registerRequest: RequestAuto = {
    APPKEY_01: 'test-somansa-001',
    SYSTEM_ID: config.system.system_id,
    FORM_ID: config.system.form_id,
    APPR_TITLE: '소만사 결재연동 테스트',
    REQ_USER: 'FP508391',
    APPR_SECURITY_TYPE: '0',
    NEXT_APPR_TYPE: `${APPR_TYPE.SELF};${APPR_TYPE.APPROVAL}`,
    NEXT_APPROVER: 'FP508391;FP508932',
  };

  const registerResponse = await registerClient.sendSingle(registerRequest);
  console.log('\n[기안 결과]');
  console.log(JSON.stringify(registerResponse, null, 2));

  if (registerResponse.IF_STATUS === 'S') {
    console.log('✅ 전자결재 기안 성공!');
  } else {
    console.log('❌ 전자결재 기안 실패:', registerResponse.IF_ERRMSG);
  }

  // =================================================================
  // 예시 2: 결재 위임 등록 (Delegator - Register)
  // =================================================================
  console.log('\n\n=== [예시 2] 결재 위임 등록 (Delegator) ===');

  const delegatorClient = await factory.getApprovalDelegatorClient();
  delegatorClient.describeClient();

  // 방법 1: execute 메서드 사용
  const delegatorRequest: SetEntrustRequest = {
    API_TYPE: API_TYPE.REGISTER,
    REQ_USER: 'FP508391', // 위임자 사번
    SIGN_USER: 'FP508932', // 수임자 사번
    START_DATE: '2026.01.10', // 위임 시작일
    END_DATE: '2026.01.20', // 위임 종료일
    SYSTEM_ID: config.system.system_id, // 시스템 ID
  };

  const delegatorResponse = await delegatorClient.execute(delegatorRequest);
  console.log('\n[위임 등록 결과]');
  console.log(JSON.stringify(delegatorResponse, null, 2));

  if (delegatorResponse.IF_STATUS === 'S') {
    console.log('✅ 결재 위임 등록 성공!');
  } else {
    console.log('❌ 결재 위임 등록 실패:', delegatorResponse.IF_ERRMSG);
  }

  // =================================================================
  // 예시 3: 결재 위임 삭제 (Delegator - Delete)
  // =================================================================
  console.log('\n\n=== [예시 3] 결재 위임 삭제 (Delegator) ===');

  const deleteResponse = await delegatorClient.deleteDelegation(
    'FP508391', // 위임자
    'FP508932', // 수임자
    config.system.system_id,
  );

  console.log('\n[위임 삭제 결과]');
  console.log(JSON.stringify(deleteResponse, null, 2));

  if (deleteResponse.IF_STATUS === 'S') {
    console.log('✅ 결재 위임 삭제 성공!');
  } else {
    console.log('❌ 결재 위임 삭제 실패:', deleteResponse.IF_ERRMSG);
  }

  console.log('\n\n=== Config Reloader 시작 ===');
  await ConfigReloader.start();
}

main().catch((e) => console.error('❌ 예상치 못한 오류:', e));
