import { BaseSOAPClient, SOAPClientConfig } from '../base_soap_client';

export enum APPR_TYPE {
  APPROVAL = 0,
  SELF = 9,
}

/**
 * 전자결재 기안 요청 데이터
 */
export interface RequestAuto {
  SYSTEM_ID: string;
  FORM_ID?: string;
  APPR_TITLE?: string;
  REQ_USER?: string;
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
}

/**
 * 전자결재 응답 데이터
 */
export interface RequestAutoResponse {
  IF_STATUS?: string;
  IF_ERRMSG?: string;
}

/**
 * 전자결재 기안(Register) 클라이언트
 * WSDL: LGCY_APRV_EA_TOTALAPRV_03_SO
 */
export class ApprovalRegisterClient extends BaseSOAPClient<RequestAuto[], RequestAutoResponse[]> {
  constructor(config: SOAPClientConfig) {
    super(config);
  }

  getClientName(): string {
    return 'ApprovalRegister';
  }

  /**
   * 전자결재 기안 요청 전송
   */
  async execute(requestData: RequestAuto[]): Promise<RequestAutoResponse[]> {
    this.ensureInitialized();

    try {
      const request = {
        requestAuto: requestData,
      };

      console.log(`[${this.getClientName()}] 요청:`, JSON.stringify(request));

      // SOAP 메서드 호출
      const [result] = await this.client!.LGCY_APRV_EA_TOTALAPRV_03_SOAsync(request);

      console.log(`[${this.getClientName()}] 응답:`, JSON.stringify(result, null, 2));

      return result.requestAutoResponse as RequestAutoResponse[];
    } catch (error) {
      console.error(`[${this.getClientName()}] 요청 전송 중 오류:`, error);
      throw error;
    }
  }

  /**
   * 편의 메서드: 단일 요청 전송
   */
  async sendSingle(requestData: RequestAuto): Promise<RequestAutoResponse> {
    const results = await this.execute([requestData]);
    return results[0];
  }
}
