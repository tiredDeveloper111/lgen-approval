import * as soap from 'soap';

import {
  ApprovalStatusRequest,
  ApprovalStatusResponse,
  API_TYPE,
  RESULT_TYPE,
} from '../types/approval_status_types';

/**
 * 결재상태 처리 SOAP 클라이언트 (테스트용)
 */
export class ApprovalStatusClient {
  private client: soap.Client | null = null;
  private wsdlUrl: string;
  private endpoint: string;

  constructor(wsdlUrl: string, endpoint: string) {
    this.wsdlUrl = wsdlUrl;
    this.endpoint = endpoint;
  }

  /**
   * SOAP 클라이언트 초기화
   */
  async initialize(): Promise<void> {
    try {
      console.log(`클라이언트 초기화 중...`);
      console.log(`- WSDL: ${this.wsdlUrl}`);
      console.log(`- Endpoint: ${this.endpoint}`);

      this.client = await soap.createClientAsync(this.wsdlUrl, {
        endpoint: this.endpoint,
      });

      console.log('✅ SOAP 클라이언트 초기화 완료\n');
    } catch (error) {
      console.error('SOAP 클라이언트 초기화 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 결재상태 처리 요청
   */
  async processApprovalStatus(request: ApprovalStatusRequest): Promise<ApprovalStatusResponse> {
    if (!this.client) {
      throw new Error('SOAP 클라이언트가 초기화되지 않았습니다. initialize()를 먼저 호출하세요.');
    }

    try {
      console.log('📤 요청 전송:');
      console.log(JSON.stringify(request, null, 2));

      // SOAP 메서드 호출
      const [result] = await this.client.processApprovalStatusAsync({
        processApprovalStatus: request,
      });

      console.log('\n📥 응답 수신:');
      console.log(JSON.stringify(result, null, 2));

      return result as ApprovalStatusResponse;
    } catch (error) {
      console.error('요청 전송 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 편의 메서드: 결재 승인
   */
  async approve(
    systemId: string,
    approver: string,
    appkey01: string = '',
    comment: string = '',
    apprDate?: string,
  ): Promise<ApprovalStatusResponse> {
    return this.processApprovalStatus({
      API_TYPE: API_TYPE.STATUS_PROCESS,
      SYSTEM_ID: systemId,
      APPKEY_01: appkey01,
      APPKEY_02: '',
      APPKEY_03: '',
      APPKEY_04: '',
      APPKEY_05: '',
      APPKEY_06: '',
      APPROVER: approver,
      COMMENT_UTF8: comment,
      COMMENT_EUCKR: '',
      RESULT: RESULT_TYPE.APPROVE,
      NEXT_APPR_TYPE: '',
      NEXT_APPROVER_ORDER: '',
      NEXT_APPROVER: '',
      READ_USER: '',
      APPR_DATE: apprDate || this.getCurrentDateTime(),
    });
  }

  /**
   * 편의 메서드: 결재 반려
   */
  async reject(
    systemId: string,
    approver: string,
    appkey01: string = '',
    comment: string = '',
    apprDate?: string,
  ): Promise<ApprovalStatusResponse> {
    return this.processApprovalStatus({
      API_TYPE: API_TYPE.STATUS_PROCESS,
      SYSTEM_ID: systemId,
      APPKEY_01: appkey01,
      APPKEY_02: '',
      APPKEY_03: '',
      APPKEY_04: '',
      APPKEY_05: '',
      APPKEY_06: '',
      APPROVER: approver,
      COMMENT_UTF8: comment,
      COMMENT_EUCKR: '',
      RESULT: RESULT_TYPE.REJECT,
      NEXT_APPR_TYPE: '',
      NEXT_APPROVER_ORDER: '',
      NEXT_APPROVER: '',
      READ_USER: '',
      APPR_DATE: apprDate || this.getCurrentDateTime(),
    });
  }

  /**
   * 편의 메서드: 최종 완료
   */
  async complete(
    systemId: string,
    approver: string,
    appkey01: string = '',
    comment: string = '',
    apprDate?: string,
  ): Promise<ApprovalStatusResponse> {
    return this.processApprovalStatus({
      API_TYPE: API_TYPE.STATUS_PROCESS,
      SYSTEM_ID: systemId,
      APPKEY_01: appkey01,
      APPKEY_02: '',
      APPKEY_03: '',
      APPKEY_04: '',
      APPKEY_05: '',
      APPKEY_06: '',
      APPROVER: approver,
      COMMENT_UTF8: comment,
      COMMENT_EUCKR: '',
      RESULT: RESULT_TYPE.COMPLETE,
      NEXT_APPR_TYPE: '',
      NEXT_APPROVER_ORDER: '',
      NEXT_APPROVER: '',
      READ_USER: '',
      APPR_DATE: apprDate || this.getCurrentDateTime(),
    });
  }

  /**
   * 편의 메서드: 결재선 수정
   */
  async updateApprovalLine(
    systemId: string,
    apprTypes: string[],
    approvers: string[],
    appkey01: string = '',
    approverOrders: string[] = [],
  ): Promise<ApprovalStatusResponse> {
    return this.processApprovalStatus({
      API_TYPE: API_TYPE.APPR_LINE_UPDATE,
      SYSTEM_ID: systemId,
      APPKEY_01: appkey01,
      APPKEY_02: '',
      APPKEY_03: '',
      APPKEY_04: '',
      APPKEY_05: '',
      APPKEY_06: '',
      APPROVER: '',
      COMMENT_UTF8: '',
      COMMENT_EUCKR: '',
      RESULT: '',
      NEXT_APPR_TYPE: apprTypes.join(';'),
      NEXT_APPROVER_ORDER: approverOrders.join(';'),
      NEXT_APPROVER: approvers.join(';'),
      READ_USER: '',
      APPR_DATE: this.getCurrentDateTime(),
    });
  }

  /**
   * 현재 날짜시간 (yyyyMMddhhmmss)
   */
  private getCurrentDateTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  /**
   * 클라이언트 정보 출력
   */
  describeClient(): void {
    if (!this.client) {
      console.log('클라이언트가 초기화되지 않았습니다.');
      return;
    }

    console.log('📋 사용 가능한 서비스:');
    console.log(JSON.stringify(this.client.describe(), null, 2));
  }
}
