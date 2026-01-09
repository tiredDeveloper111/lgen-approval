import * as soap from 'soap';
import express from 'express';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';

// SOAP 콜백 타입 정의
type SoapCallback = (error: any, result: any) => void;

// 인터페이스 정의
interface RequestAuto {
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
  NEXT_APPR_TYPE?: string;
  NEXT_APPROVER?: string;
  READ_USER?: string;
  READ_DEPT?: string;
  FORM_DATA?: string;
  IS_RETURN_APPR_ID?: string;
}

interface RequestAutoResponse {
  IF_STATUS: string;
  IF_ERRMSG?: string;
}

// 서비스 구현
const approvalService: any = {
  LGCY_APRV_EA_TOTALAPRV_03_SOService: {
    HTTP_Port: {
      LGCY_APRV_EA_TOTALAPRV_03_SO: function (args: any, callback: SoapCallback) {
        console.log('SOAP 요청 수신:');
        console.log(JSON.stringify(args, null, 2));

        try {
          // 요청 데이터 추출
          const requestData = args.MT_LGCY_APRV_EA_TOTALAPRV_03_S?.requestAuto || [];

          console.log('요청 데이터 타입:', typeof requestData, Array.isArray(requestData));

          // 배열이 아닌 경우 배열로 변환
          const requestArray = Array.isArray(requestData) ? requestData : [requestData];

          // 응답 데이터 생성
          const responses: RequestAutoResponse[] = requestArray.map((req: RequestAuto) => {
            // 필수 필드 검증
            if (!req.SYSTEM_ID || !req.APPKEY_01) {
              return {
                IF_STATUS: 'E',
                IF_ERRMSG: '필수 필드(SYSTEM_ID, APPKEY_01)가 누락되었습니다.',
              };
            }

            // 성공 응답
            return {
              IF_STATUS: 'S',
              IF_ERRMSG: '',
            };
          });

          // 응답 반환
          const result = {
            MT_LGCY_APRV_EA_TOTALAPRV_03_S_response: {
              requestAutoResponse: responses.length === 1 ? responses[0] : responses,
            },
          };

          console.log('SOAP 응답:');
          console.log(JSON.stringify(result, null, 2));

          callback(null, result);
        } catch (error) {
          console.error('SOAP 요청 처리 중 오류 발생:', error);

          // 오류 응답
          const errorResponse = {
            MT_LGCY_APRV_EA_TOTALAPRV_03_S_response: {
              requestAutoResponse: {
                IF_STATUS: 'E',
                IF_ERRMSG: `서버 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
              },
            },
          };

          callback(null, errorResponse);
        }
      },
    },
    HTTPS_Port: {
      LGCY_APRV_EA_TOTALAPRV_03_SO: function (args: any, callback: SoapCallback) {
        console.log('SOAP 요청 수신 (HTTPS):');
        console.log(JSON.stringify(args, null, 2));

        try {
          // 요청 데이터 추출
          const requestData = args.MT_LGCY_APRV_EA_TOTALAPRV_03_S?.requestAuto || [];

          console.log('요청 데이터 타입:', typeof requestData, Array.isArray(requestData));

          // 배열이 아닌 경우 배열로 변환
          const requestArray = Array.isArray(requestData) ? requestData : [requestData];

          // 응답 데이터 생성
          const responses: RequestAutoResponse[] = requestArray.map((req: RequestAuto) => {
            // 필수 필드 검증
            if (!req.SYSTEM_ID || !req.APPKEY_01) {
              return {
                IF_STATUS: 'E',
                IF_ERRMSG: '필수 필드(SYSTEM_ID, APPKEY_01)가 누락되었습니다.',
              };
            }

            // 성공 응답
            return {
              IF_STATUS: 'S',
              IF_ERRMSG: '',
            };
          });

          // 응답 반환
          const result = {
            MT_LGCY_APRV_EA_TOTALAPRV_03_S_response: {
              requestAutoResponse: responses.length === 1 ? responses[0] : responses,
            },
          };

          console.log('SOAP 응답 (HTTPS):');
          console.log(JSON.stringify(result, null, 2));

          callback(null, result);
        } catch (error) {
          console.error('SOAP 요청 처리 중 오류 발생:', error);

          // 오류 응답
          const errorResponse = {
            MT_LGCY_APRV_EA_TOTALAPRV_03_S_response: {
              requestAutoResponse: {
                IF_STATUS: 'E',
                IF_ERRMSG: `서버 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
              },
            },
          };

          callback(null, errorResponse);
        }
      },
    },
  },
};

class ApprovalSoapServer {
  private app: express.Express;
  private server: any;
  private wsdlPath: string;
  private port: number;

  constructor(wsdlPath: string, port: number = 8000) {
    this.wsdlPath = wsdlPath;
    this.port = port;
    this.app = express();

    // 미들웨어 설정
    this.app.use(cors());
    this.app.use(bodyParser.raw({ type: () => true, limit: '5mb' }));
    this.app.use(bodyParser.json());

    // 기본 라우트 설정
    this.app.get('/', (req, res) => {
      res.send('전자결재 SOAP 목업 서버가 실행 중입니다.');
    });

    // XISOAPAdapter 경로 설정 (원래 URL 구조 유지)
    this.app.all('/XISOAPAdapter/MessageServlet', (req, res, next) => {
      // SOAP 요청을 /soap 경로로 리다이렉트
      req.url = '/soap';
      next();
    });

    // WSDL URL 경로 설정
    this.app.get('/dir/wsdl', (req, res, next) => {
      // WSDL 요청을 /soap?wsdl 경로로 리다이렉트
      req.url = '/soap?wsdl';
      next();
    });
  }

  /**
   * SOAP 서버 시작
   */
  async start(): Promise<void> {
    try {
      // WSDL 파일 경로가 상대 경로인 경우 절대 경로로 변환
      const absoluteWsdlPath = path.isAbsolute(this.wsdlPath)
        ? this.wsdlPath
        : path.resolve(process.cwd(), this.wsdlPath);

      // WSDL 파일이 존재하는지 확인
      if (!fs.existsSync(absoluteWsdlPath)) {
        throw new Error(`WSDL 파일을 찾을 수 없습니다: ${absoluteWsdlPath}`);
      }

      // WSDL 파일 읽기
      const wsdl = fs.readFileSync(absoluteWsdlPath, 'utf8');

      // SOAP 서버 생성
      const soapServer = soap.listen(this.app, '/soap', approvalService, wsdl);

      // 서버 이벤트 처리
      soapServer.log = (type: string, data: any) => {
        console.log(`[SOAP ${type}]`, data);
      };

      // HTTP 서버 시작
      this.server = this.app.listen(this.port, () => {
        console.log(`전자결재 SOAP 목업 서버가 포트 ${this.port}에서 시작되었습니다.`);
        console.log(`WSDL: http://localhost:${this.port}/soap?wsdl`);
      });
    } catch (error) {
      console.error('SOAP 서버 시작 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * SOAP 서버 종료
   */
  stop(): void {
    if (this.server) {
      this.server.close();
      console.log('전자결재 SOAP 목업 서버가 종료되었습니다.');
    }
  }
}

// 서버 실행 예시
if (require.main === module) {
  const wsdlPath = path.resolve(__dirname, '../test.wsdl');
  const server = new ApprovalSoapServer(wsdlPath);

  server.start().catch((error) => {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  });

  // 프로세스 종료 시 서버 정상 종료
  process.on('SIGINT', () => {
    console.log('서버를 종료합니다...');
    server.stop();
    process.exit(0);
  });
}

export { ApprovalSoapServer };
