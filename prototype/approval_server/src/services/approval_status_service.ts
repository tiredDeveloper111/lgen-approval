import moment from 'moment';
import { Config } from '../config';
import {
  API_TYPE,
  ApprovalStatusRequest,
  ApprovalStatusResponse,
  RESULT_TYPE,
} from '../types/approval_status_types';
import { VshrClient } from './vshr_client';
import { ProcessResultReq, VsmgmtClient } from './vsmgmt_client';
import winston from 'winston';
import { Logger } from '../logger_decorator';
/**
 * 결재상태 처리 서비스
 */
export class ApprovalStatusService {
  @Logger('VSFAccessKeySync')
  private readonly logger: winston.Logger;
  constructor(
    private readonly vshrClient: VshrClient,
    private readonly vsmgmtClient: VsmgmtClient,
  ) {}
  /**
   * 결재상태 처리 메인 핸들러
   */
  async processApprovalStatus(request: ApprovalStatusRequest): Promise<ApprovalStatusResponse> {
    this.logger.info('\n=== 결재상태 처리 요청 수신 ===');
    this.logger.info(JSON.stringify(request, null, 2));

    try {
      // 요청 유효성 검증
      this.validateRequest(request);

      // API 타입에 따라 분기
      switch (request.API_TYPE) {
        case API_TYPE.STATUS_PROCESS:
          return await this.handleStatusProcess(request);

        case API_TYPE.APPR_LINE_UPDATE:
          return await this.handleApprLineUpdate(request);

        default:
          throw new Error(`지원하지 않는 API_TYPE: ${request.API_TYPE}`);
      }
    } catch (error) {
      console.error('처리 중 오류 발생:', error);
      return {
        IF_STATUS: 'E',
        IF_ERRMSG: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }

  /**
   * A01: 결재상태 처리
   */
  private async handleStatusProcess(
    request: ApprovalStatusRequest,
  ): Promise<ApprovalStatusResponse> {
    const userInfo = await this.vshrClient.getUserFromEmpCode(request.APPROVER.split(';'));

    if (!userInfo.success) {
      throw new Error(`결재자 ${request.APPROVER}의 정보가 존재하지 않습니다.`);
    }
    // 위임은 없다고 메일로 확답 받음.
    const [approver] = userInfo.data;

    const req: ProcessResultReq = {
      requestId: request.APPKEY_01,
      approverId: approver.id,
      apprDate: moment(request.APPR_DATE, 'YYYYMMDDHHmmss').format('YYYY-MM-DD HH:mm:ss'),
      approverName: approver.name,
      comment: request.COMMENT_EUCKR || request.COMMENT_UTF8,
      result: request.RESULT,
    };

    await this.vsmgmtClient.postProcessResult(req);

    return {
      IF_STATUS: 'S',
      IF_ERRMSG: '결재상태 처리가 완료되었습니다.',
    };
  }

  /**
   * A02: 결재선 수정
   */
  private async handleApprLineUpdate(
    _request: ApprovalStatusRequest,
  ): Promise<ApprovalStatusResponse> {
    return {
      IF_STATUS: 'E',
      IF_ERRMSG: '결재선 수정은 지원하지 않습니다.',
    };
  }

  /**
   * 요청 유효성 검증
   */
  private validateRequest(request: ApprovalStatusRequest): void {
    // 타입스크립트로 필수 필드 검증이 되므로 추가 검증은 비즈니스 로직만

    // API 타입 유효성 검증
    if (
      request.API_TYPE !== API_TYPE.STATUS_PROCESS &&
      request.API_TYPE !== API_TYPE.APPR_LINE_UPDATE
    ) {
      throw new Error(`지원하지 않는 API_TYPE: ${request.API_TYPE}`);
    }

    // 결재 결과 유효성 검증 (A01의 경우)
    if (request.API_TYPE === API_TYPE.STATUS_PROCESS) {
      const validResults = Object.values(RESULT_TYPE);
      if (!validResults.includes(request.RESULT as RESULT_TYPE)) {
        throw new Error(`지원하지 않는 RESULT: ${request.RESULT}`);
      }
    }

    const config = Config.getConfig();

    if (request.SYSTEM_ID !== config.system.system_id) {
      throw new Error(
        `SYSTEM ID가 일치하지 않습니다: ${config.system.system_id}/${request.SYSTEM_ID}`,
      );
    }
  }

  /**
   * 결재 타입 이름 반환
   */
  private getApprTypeName(type: string): string {
    const typeMap: Record<string, string> = {
      '0': '결재',
      '1': '협의(필수)',
      '2': '협의(선택)',
      '6': '합의',
      '7': '보고',
      '8': '투자담당',
      '9': '자가승인',
      '10': '병렬합의',
    };
    return typeMap[type] || '알 수 없음';
  }
}
