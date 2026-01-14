/**
 * API 타입
 */
export enum API_TYPE {
  STATUS_PROCESS = 'A01', // 결재상태 처리
  APPR_LINE_UPDATE = 'A02', // 결재선 수정
}

/**
 * 결재 처리 결과
 */
export enum RESULT_TYPE {
  APPROVE = 'APPROVE', // 승인
  REJECT = 'REJECT', // 반려
  COMPLETE = 'COMPLETE', // 최종완료
  AGREE = 'AGREE', // 합의(합의완료)
  DISAGREE = 'DISAGREE', // 합의(합의거부)
  OK = 'OK', // 협의(찬성)
  NO = 'NO', // 협의(반대)
  CANCEL = 'CANCEL', // 결재취소
  REVIEW = 'REVIEW', // 검토
}

/**
 * 결재 타입
 */
export enum APPR_TYPE {
  APPROVAL = '0', // 결재
  CONSULT_REQUIRED = '1', // 협의(필수)
  CONSULT_OPTIONAL = '2', // 협의(선택)
  AGREE = '6', // 합의
  REPORT = '7', // 보고
  INVESTMENT = '8', // 투자담당
  SELF = '9', // 자가승인
  PARALLEL_AGREE = '10', // 병렬합의
}

/**
 * 결재상태 처리 요청
 */
export interface ApprovalStatusRequest {
  API_TYPE: string; // API 유형 (A01: 결재상태 처리, A02: 결재선 수정)
  SYSTEM_ID: string; // 시스템 ID (예: BMIL)
  APPKEY_01: string; // 애플리케이션 키 1
  APPKEY_02: string; // 애플리케이션 키 2
  APPKEY_03: string; // 애플리케이션 키 3
  APPKEY_04: string; // 애플리케이션 키 4
  APPKEY_05: string; // 애플리케이션 키 5
  APPKEY_06: string; // 애플리케이션 키 6
  APPROVER: string; // 결재자의 사번;위임자의사번 (예: FP508391;FP508932)
  COMMENT_UTF8: string; // 결재 의견 UTF8
  COMMENT_EUCKR: string; // 결재 의견 EUCKR
  RESULT: string; // 결재 처리 결과 (APPROVE, REJECT, COMPLETE 등)
  NEXT_APPR_TYPE: string; // 전체 결재선의 결재타입 (예: "0;2;1;0;0;9")
  NEXT_APPROVER_ORDER: string; // 전체 결재선의 결재자 표시, 구분자 ';'
  NEXT_APPROVER: string; // 전체 결재선의 결재자 사번, 구분자 ';'
  READ_USER: string;
  APPR_DATE: string; // 결재처리일시 (yyyyMMddhhmmss)
}

/**
 * 결재상태 처리 응답
 */
export interface ApprovalStatusResponse {
  IF_STATUS?: string; // 처리 상태 (S: 성공, E: 실패)
  IF_ERRMSG?: string; // 에러 메시지
}

/**
 * SOAP 서비스 메서드 파라미터
 */
export interface ProcessApprovalStatusArgs {
  processApprovalStatus: ApprovalStatusRequest;
}


