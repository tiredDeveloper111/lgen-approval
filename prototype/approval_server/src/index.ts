import { SOAPServer } from './soap_server';
import { Config, ConfigReloader } from './config';
import path from 'path';
import { ApprovalStatusService } from './services/approval_status_service';
import { VshrClient } from './services/vshr_client';
import { AxiosWrapper } from './services/axios_wrapper';
import { VsmgmtClient } from './services/vsmgmt_client';
import { LoggerFactory } from './logger';

const logger = LoggerFactory.getLogger('MAIN');
async function main() {
  logger.info('=== 결재상태 처리 SOAP 서버 시작 ===\n');

  // 설정 로드
  const config = Config.getConfig();

  // WSDL 파일 경로
  const wsdlPath = path.resolve(process.cwd(), config.wsdl.path);

  // SOAP 서버 생성 및 시작
  const requestor = new AxiosWrapper();

  const vshrClient = new VshrClient(requestor);
  const vsmgmtClient = new VsmgmtClient(requestor);

  const service = new ApprovalStatusService(vshrClient, vsmgmtClient);
  const server = new SOAPServer(
    wsdlPath,
    config.server.listen_port,
    config.server.service_port,
    service,
    config.server.host,
  );

  ConfigReloader.start();
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
