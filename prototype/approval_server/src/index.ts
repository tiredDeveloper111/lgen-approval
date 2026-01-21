import path from 'path';
import { Config } from './config';
import { LoggerFactory } from './logger';
import { ApprovalStatusService } from './services/approval_status_service';
import { ApprovalSyncScheduler } from './services/approval_sync_scheduler';
import { AxiosWrapper } from './services/axios_wrapper';
import { SOAPClientFactory } from './services/soap_clients';
import { VshrClient } from './services/vshr_client';
import { VsmgmtClient } from './services/vsmgmt_client';
import { SOAPServer } from './soap_server';

const logger = LoggerFactory.getLogger('MAIN');
async function main() {
  logger.info('=== 결재상태 처리 SOAP 서버 시작 ===\n');

  // 설정 로드
  const config = Config.getConfig();

  // 서버
  // WSDL 파일 경로
  const wsdlPath = path.resolve(process.cwd(), config.approval_server.wsdl_path);
  // SOAP 서버 생성 및 시작
  const requestor = new AxiosWrapper();

  const vshrClient = new VshrClient(requestor);
  const vsmgmtClient = new VsmgmtClient(requestor);

  const service = new ApprovalStatusService(vshrClient, vsmgmtClient);
  const server = new SOAPServer(
    wsdlPath,
    config.approval_server.listen_port,
    config.approval_server.service_port,
    service,
    config.approval_server.host,
  );

  // 클라이언트

  const factory = new SOAPClientFactory({
    approvalRegister: {
      wsdlPathOrUrl: config.approval_client.register.wsdl,
      endpoint: config.approval_client.register.endpoint,
      username: config.approval_client.username,
      password: config.approval_client.password,
    },
  });

  const registerClient = await factory.getApprovalRegisterClient();
  const scheduler = new ApprovalSyncScheduler(vshrClient, vsmgmtClient, registerClient);

  scheduler.start().catch((e) => logger.error('Unexpected error %s', e.stack || e));

  await server.start();

  // 종료 시그널 처리
  process.on('SIGINT', async () => {
    logger.info('\n서버를 종료합니다...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('\n서버를 종료합니다...');
    await server.stop();
    process.exit(0);
  });
}

main().catch((e) => {
  logger.error('❌ 서버 시작 중 오류:', e);
  process.exit(1);
});
