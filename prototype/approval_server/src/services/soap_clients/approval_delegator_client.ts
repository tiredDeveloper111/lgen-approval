import { BaseSOAPClient, SOAPClientConfig } from '../base_soap_client';

/**
 * API 유형
 */
export enum API_TYPE {
  REGISTER = 'A01', // 위임정보 등록
  DELETE = 'A02', // 위임정보 삭제
}

/**
 * 결재 위임 요청 데이터
 */
export interface SetEntrustRequest {
  API_TYPE?: string; // API 유형 (A01: 위임정보 등록, A02: 위임정보 삭제)
  REQ_USER?: string; // 위임자 사번
  SIGN_USER?: string; // 수임자 사번
  START_DATE?: string; // 위임 시작일 (예: 2018.05.26)
  END_DATE?: string; // 위임 종료일 (예: 2018.05.31)
  SYSTEM_ID?: string; // Legacy 시스템ID
}

/**
 * 결재 위임 응답 데이터
 */
export interface SetEntrustResponse {
  IF_STATUS?: string;
  IF_ERRMSG?: string;
}

/**
 * 전자결재 위임(Delegator) 클라이언트
 * WSDL: LGCY_APRV_EA_TOTALAPRV_06_SO
 */
export class ApprovalDelegatorClient extends BaseSOAPClient<
  SetEntrustRequest,
  SetEntrustResponse
> {
  constructor(config: SOAPClientConfig) {
    super(config);
  }

  getClientName(): string {
    return 'ApprovalDelegator';
  }

  /**
   * 결재 위임 정보 전송
   */
  async execute(requestData: SetEntrustRequest): Promise<SetEntrustResponse> {
    this.ensureInitialized();

    try {
      const request = {
        setEntrust: requestData,
      };

      console.log(`[${this.getClientName()}] 요청:`, JSON.stringify(request));

      // SOAP 메서드 호출
      const [result] = await this.client!.LGCY_APRV_EA_TOTALAPRV_06_SOAsync(request);

      console.log(`[${this.getClientName()}] 응답:`, JSON.stringify(result, null, 2));

      // 응답 구조: { return: { IF_STATUS, IF_ERRMSG } }
      return result.return as SetEntrustResponse;
    } catch (error) {
      console.error(`[${this.getClientName()}] 요청 전송 중 오류:`, error);
      throw error;
    }
  }

  /**
   * 편의 메서드: 위임 정보 등록
   */
  async registerDelegation(
    reqUser: string,
    signUser: string,
    startDate: string,
    endDate: string,
    systemId: string,
  ): Promise<SetEntrustResponse> {
    return this.execute({
      API_TYPE: API_TYPE.REGISTER,
      REQ_USER: reqUser,
      SIGN_USER: signUser,
      START_DATE: startDate,
      END_DATE: endDate,
      SYSTEM_ID: systemId,
    });
  }

  /**
   * 편의 메서드: 위임 정보 삭제
   */
  async deleteDelegation(
    reqUser: string,
    signUser: string,
    systemId: string,
  ): Promise<SetEntrustResponse> {
    return this.execute({
      API_TYPE: API_TYPE.DELETE,
      REQ_USER: reqUser,
      SIGN_USER: signUser,
      SYSTEM_ID: systemId,
    });
  }
}

