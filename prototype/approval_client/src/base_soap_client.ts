import * as soap from 'soap';
import * as fs from 'fs';
import * as path from 'path';

export interface SOAPClientConfig {
  wsdlPathOrUrl: string;
  endpoint?: string;
  username?: string;
  password?: string;
}

/**
 * Base SOAP Client - 모든 SOAP 클라이언트의 공통 로직
 */
export abstract class BaseSOAPClient<TRequest = any, TResponse = any> {
  protected client: soap.Client | null = null;
  protected config: SOAPClientConfig;
  protected isWsdlUrl: boolean;

  constructor(config: SOAPClientConfig) {
    this.config = config;
    this.isWsdlUrl =
      config.wsdlPathOrUrl.startsWith('http://') ||
      config.wsdlPathOrUrl.startsWith('https://');
  }

  /**
   * SOAP 클라이언트 초기화
   */
  async initialize(): Promise<void> {
    try {
      let wsdlSource = this.config.wsdlPathOrUrl;

      // URL이 아닌 경우 파일 경로로 처리
      if (!this.isWsdlUrl) {
        const absoluteWsdlPath = path.isAbsolute(this.config.wsdlPathOrUrl)
          ? this.config.wsdlPathOrUrl
          : path.resolve(process.cwd(), this.config.wsdlPathOrUrl);

        if (!fs.existsSync(absoluteWsdlPath)) {
          throw new Error(`WSDL 파일을 찾을 수 없습니다: ${absoluteWsdlPath}`);
        }

        wsdlSource = absoluteWsdlPath;
      }

      // 인증 정보 처리
      const options: soap.IOptions = {
        endpoint: this.config.endpoint || undefined,
      };

      if (this.config.username && this.config.password) {
        const auth =
          'Basic ' +
          Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
        options.wsdl_headers = { Authorization: auth };
      }

      // SOAP 클라이언트 생성
      this.client = await soap.createClientAsync(wsdlSource, options);

      if (this.config.username && this.config.password) {
        this.client.setSecurity(
          new soap.BasicAuthSecurity(this.config.username, this.config.password),
        );
      }

      console.log(`[${this.getClientName()}] SOAP 클라이언트가 초기화되었습니다.`);
    } catch (error) {
      console.error(`[${this.getClientName()}] 초기화 중 오류 발생:`, error);
      throw error;
    }
  }

  /**
   * 클라이언트가 초기화되었는지 확인
   */
  protected ensureInitialized(): void {
    if (!this.client) {
      throw new Error(
        `[${this.getClientName()}] SOAP 클라이언트가 초기화되지 않았습니다. initialize() 메서드를 먼저 호출하세요.`,
      );
    }
  }

  /**
   * 클라이언트 설명 출력
   */
  describeClient(): void {
    if (!this.client) {
      console.log('클라이언트가 초기화되지 않았습니다.');
      return;
    }

    console.log(`[${this.getClientName()}] 사용 가능한 서비스:`);
    console.log(JSON.stringify(this.client.describe(), null, 2));
  }

  /**
   * 각 클라이언트의 이름 (로깅용)
   */
  abstract getClientName(): string;

  /**
   * 실제 SOAP 메서드 호출은 하위 클래스에서 구현
   */
  abstract execute(request: TRequest): Promise<TResponse>;
}

