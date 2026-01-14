import * as soap from 'soap';
import * as fs from 'fs';

import * as http from 'http';
import { ApprovalStatusService } from './services/approval_status_service';
import { ProcessApprovalStatusArgs } from './types/approval_status_types';

/**
 * SOAP 서버 설정 및 실행
 */
export class SOAPServer {
  private server: http.Server | null = null;

  constructor(
    private readonly wsdlPath: string,
    private readonly port: number,
    private readonly service: ApprovalStatusService,
  ) {}

  /**
   * SOAP 서비스 정의
   */
  private getServiceDefinition() {
    return {
      ApprovalStatusService: {
        ApprovalStatusPort: {
          processApprovalStatus: async (args: ProcessApprovalStatusArgs) => {
            console.log('\n========================================');
            console.log('SOAP 요청 수신');
            console.log('========================================');

            try {
              const request = args.processApprovalStatus;
              const response = await this.service.processApprovalStatus(request);

              console.log('\n응답 데이터:');
              console.log(JSON.stringify(response, null, 2));
              console.log('========================================\n');

              // 1 depth 응답 구조로 반환
              return response;
            } catch (error) {
              console.error('SOAP 요청 처리 중 오류:', error);
              return {
                IF_STATUS: 'E',
                IF_ERRMSG: error instanceof Error ? error.message : '알 수 없는 오류',
              };
            }
          },
        },
      },
    };
  }

  /**
   * SOAP 서버 시작
   */
  async start(): Promise<void> {
    try {
      // WSDL 파일 확인
      if (!fs.existsSync(this.wsdlPath)) {
        throw new Error(`WSDL 파일을 찾을 수 없습니다: ${this.wsdlPath}`);
      }

      // WSDL 파일 읽기
      const wsdlXml = fs.readFileSync(this.wsdlPath, 'utf8');

      // HTTP 서버 생성
      const app = (req: http.IncomingMessage, res: http.ServerResponse) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`
          <html>
            <head><title>Approval Status SOAP Service</title></head>
            <body>
              <h1>결재상태 처리 SOAP 서비스</h1>
              <p>서비스가 정상적으로 실행 중입니다.</p>
              <ul>
                <li><a href="/approval-status?wsdl">WSDL 보기</a></li>
              </ul>
              <h2>API 정보</h2>
              <h3>A01: 결재상태 처리</h3>
              <ul>
                <li>SYSTEM_ID: 시스템 ID</li>
                <li>APPROVER: 결재자 사번</li>
                <li>RESULT: 결재 결과 (APPROVE, REJECT, COMPLETE 등)</li>
                <li>APPR_DATE: 결재처리일시</li>
              </ul>
              <h3>A02: 결재선 수정</h3>
              <ul>
                <li>SYSTEM_ID: 시스템 ID</li>
                <li>NEXT_APPR_TYPE: 결재타입 (예: "0;2;1;0")</li>
                <li>NEXT_APPROVER: 결재자 사번 (예: "FP001;FP002")</li>
              </ul>
            </body>
          </html>
        `);
      };

      this.server = http.createServer(app);

      // SOAP 서비스 정의
      const serviceDefinition = this.getServiceDefinition();

      // SOAP 서비스 바인딩
      soap.listen(this.server, '/approval-status', serviceDefinition, wsdlXml);

      // 서버 시작
      this.server.listen(this.port, () => {
        console.log('========================================');
        console.log('🚀 SOAP 서버가 시작되었습니다!');
        console.log('========================================');
        console.log(`포트: ${this.port}`);
        console.log(`WSDL: http://localhost:${this.port}/approval-status?wsdl`);
        console.log(`Endpoint: http://localhost:${this.port}/approval-status`);
        console.log('========================================\n');
      });
    } catch (error) {
      console.error('SOAP 서버 시작 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * SOAP 서버 중지
   */
  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve, reject) => {
        this.server!.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('SOAP 서버가 중지되었습니다.');
            resolve();
          }
        });
      });
    }
  }
}
