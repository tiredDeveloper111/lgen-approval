import { BaseSOAPClient, SOAPClientConfig } from '../base_soap_client';

/**
 * 전자결재 취소 요청 데이터 (예시)
 */
export interface CancelRequest {
  APPR_DOC_NO: string; // 결재문서번호
  CANCEL_REASON?: string; // 취소사유
  REQ_USER: string; // 요청자
}

/**
 * 전자결재 취소 응답 데이터 (예시)
 */
export interface CancelResponse {
  IF_STATUS?: string;
  IF_ERRMSG?: string;
}

/**
 * 전자결재 취소(Cancel) 클라이언트 예시
 * 다른 WSDL을 사용하는 클라이언트
 */
export class ApprovalCancelClient extends BaseSOAPClient<CancelRequest[], CancelResponse[]> {
  constructor(config: SOAPClientConfig) {
    super(config);
  }

  getClientName(): string {
    return 'ApprovalCancel';
  }

  /**
   * 전자결재 취소 요청 전송
   */
  async execute(requestData: CancelRequest[]): Promise<CancelResponse[]> {
    this.ensureInitialized();

    try {
      const request = {
        cancelRequest: requestData,
      };

      console.log(`[${this.getClientName()}] 요청:`, JSON.stringify(request));

      // SOAP 메서드 호출 (실제 메서드명은 WSDL에 따라 다름)
      // const [result] = await this.client!.LGCY_APRV_CANCEL_SOAsync(request);

      // 임시 응답 (실제로는 위 메서드 호출 결과 사용)
      const result = { cancelResponse: [{ IF_STATUS: 'S', IF_ERRMSG: 'OK' }] };

      console.log(`[${this.getClientName()}] 응답:`, JSON.stringify(result, null, 2));

      return result.cancelResponse as CancelResponse[];
    } catch (error) {
      console.error(`[${this.getClientName()}] 요청 전송 중 오류:`, error);
      throw error;
    }
  }
}

