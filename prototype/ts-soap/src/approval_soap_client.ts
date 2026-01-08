import * as soap from 'soap';
import * as fs from 'fs';
import * as path from 'path';

export enum APPR_TYPE {
  APPROVAL = 0,
  SELF = 9,
}
// 클래스 정의
class RequestAuto {
  SYSTEM_ID: string;
  FORM_ID: string;
  APPR_TITLE: string;
  REQ_USER: string;
  APPKEY_01: string;
  APPKEY_02?: string;
  APPKEY_03?: string;
  APPKEY_04?: string;
  APPKEY_05?: string;
  FORM_EDITOR_DATA?: string;
  FORM_MOBILE_DATA?: string;
  APPR_SECURITY_TYPE?: string;
  APPR_DOC_NO?: string;
  APPR_LINE_TYPE?: string;
  APPR_PERIOD_CD?: string;
  FILE_LINK_NAME?: string;
  FILE_LINK_URL?: string;
  FILE_SIZE?: string;
  NEXT_APPR_TYPE: string;
  NEXT_APPROVER: string;
  READ_USER?: string;
  READ_DEPT?: string;
  FORM_DATA?: string;
  IS_RETURN_APPR_ID?: string;

  constructor(init: RequestAuto) {
    this.SYSTEM_ID = init?.SYSTEM_ID || '';
    this.APPKEY_01 = init?.APPKEY_01 || '';
    this.FORM_ID = init?.FORM_ID;
    this.APPR_TITLE = init?.APPR_TITLE;
    this.REQ_USER = init?.REQ_USER;
    this.APPKEY_02 = init?.APPKEY_02;
    this.APPKEY_03 = init?.APPKEY_03;
    this.APPKEY_04 = init?.APPKEY_04;
    this.APPKEY_05 = init?.APPKEY_05;
    this.FORM_EDITOR_DATA = init?.FORM_EDITOR_DATA;
    this.FORM_MOBILE_DATA = init?.FORM_MOBILE_DATA;
    this.APPR_SECURITY_TYPE = init?.APPR_SECURITY_TYPE;
    this.APPR_DOC_NO = init?.APPR_DOC_NO;
    this.APPR_LINE_TYPE = init?.APPR_LINE_TYPE;
    this.APPR_PERIOD_CD = init?.APPR_PERIOD_CD;
    this.FILE_LINK_NAME = init?.FILE_LINK_NAME;
    this.FILE_LINK_URL = init?.FILE_LINK_URL;
    this.FILE_SIZE = init?.FILE_SIZE;
    this.NEXT_APPR_TYPE = init?.NEXT_APPR_TYPE;
    this.NEXT_APPROVER = init?.NEXT_APPROVER;
    this.READ_USER = init?.READ_USER;
    this.READ_DEPT = init?.READ_DEPT;
    this.FORM_DATA = init?.FORM_DATA;
    this.IS_RETURN_APPR_ID = init?.IS_RETURN_APPR_ID;
  }
}

interface TotalAprvRequest {
  MT_LGCY_APRV_EA_TOTALAPRV_03_S: {
    requestAuto: RequestAuto[];
  };
}

interface RequestAutoResponse {
  IF_STATUS?: string;
  IF_ERRMSG?: string;
}

interface TotalAprvResponse {
  MT_LGCY_APRV_EA_TOTALAPRV_03_S_response: {
    requestAutoResponse: RequestAutoResponse[];
  };
}

class ApprovalClient {
  private client: soap.Client | null = null;
  private wsdlPath: string;
  private endpoint: string;
  private isWsdlUrl: boolean;

  constructor(wsdlPathOrUrl: string, endpoint?: string) {
    this.wsdlPath = wsdlPathOrUrl;
    // endpoint가 제공되지 않으면 WSDL에 정의된 endpoint를 사용
    this.endpoint = endpoint || '';
    // URL인지 확인 (http:// 또는 https://로 시작하는지)
    this.isWsdlUrl = wsdlPathOrUrl.startsWith('http://') || wsdlPathOrUrl.startsWith('https://');
  }

  /**
   * SOAP 클라이언트 초기화
   */
  async initialize(): Promise<void> {
    try {
      let wsdlSource = this.wsdlPath;

      // URL이 아닌 경우 파일 경로로 처리
      if (!this.isWsdlUrl) {
        // WSDL 파일 경로가 상대 경로인 경우 절대 경로로 변환
        const absoluteWsdlPath = path.isAbsolute(this.wsdlPath)
          ? this.wsdlPath
          : path.resolve(process.cwd(), this.wsdlPath);

        // WSDL 파일이 존재하는지 확인
        if (!fs.existsSync(absoluteWsdlPath)) {
          throw new Error(`WSDL 파일을 찾을 수 없습니다: ${absoluteWsdlPath}`);
        }

        wsdlSource = absoluteWsdlPath;
      }

      const auth = "Basic "+ Buffer.from(`SPI_APRV_01:lgchem2016`).toString("base64")
      // SOAP 클라이언트 생성
      this.client = await soap.createClientAsync(wsdlSource, {
        endpoint: this.endpoint || undefined,
        wsdl_headers: { Authorization: auth}
      });

      this.client.setSecurity(new soap.BasicAuthSecurity('SPI_APRV_01', 'lgchem2016'));

      console.log('SOAP 클라이언트가 초기화되었습니다.');
    } catch (error) {
      console.error('SOAP 클라이언트 초기화 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 전자결재 요청 전송
   */
  async sendApprovalRequest(requestData: RequestAuto[]): Promise<RequestAutoResponse[]> {
    if (!this.client) {
      throw new Error(
        'SOAP 클라이언트가 초기화되지 않았습니다. initialize() 메서드를 먼저 호출하세요.',
      );
    }

    try {
      const request: TotalAprvRequest = {
        MT_LGCY_APRV_EA_TOTALAPRV_03_S: {
          requestAuto: requestData,
        },
      };

      console.log("SEND REQ:" ,JSON.stringify(request))
      // SOAP 요청 전송
      const [result] = await this.client.LGCY_APRV_EA_TOTALAPRV_03_SOAsync(request);
      const response = result as TotalAprvResponse;

      return response.MT_LGCY_APRV_EA_TOTALAPRV_03_S_response.requestAutoResponse;
    } catch (error) {
      console.error('전자결재 요청 전송 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 클라이언트 설정 확인
   */
  describeClient(): void {
    if (!this.client) {
      console.log('클라이언트가 초기화되지 않았습니다.');
      return;
    }

    console.log('사용 가능한 서비스:');
    console.log(JSON.stringify(this.client.describe()));
  }
}

// 사용 예시는 example.ts 파일을 참조하세요.

export { ApprovalClient, RequestAuto, RequestAutoResponse };
