import { APPR_TYPE, ApprovalClient, RequestAuto } from './approval_soap_client';
import { Config, ConfigReloader } from './config';

async function main() {
  const config = Config.getConfig();

  const wsdlURL = config.url.wsdl;
  const endpointURL = config.url.endpoint;

  const approvalSoapClient = new ApprovalClient(wsdlURL, endpointURL);

  await approvalSoapClient.initialize();

  approvalSoapClient.describeClient();

  const data: RequestAuto = {
    APPKEY_01: 'test-somansa-001',
            SYSTEM_ID: 'BMIL',
            FORM_ID: 'BMIL-F00001',
            APPR_TITLE: '소만사 결재연동 테스트',
            REQ_USER: 'FP508391',
            APPR_SECURITY_TYPE: 0,
            NEXT_APPR_TYPE: `${APPR_TYPE.SELF};${APPR_TYPE.APPROVAL}`,
            NEXT_APPROVER: 'FP508391;FP508932'
  };

  const test = await approvalSoapClient.sendApprovalRequest([data]);

  console.log(JSON.stringify(test));
  await ConfigReloader.start();
}

main().catch((e) => console.error('unexpected error: ', e));
