import { SOAPClientConfig } from './base_soap_client';
import { ApprovalRegisterClient } from './clients/approval_register_client';

import { ApprovalDelegatorClient } from './clients/approval_delegator_client';

export interface ClientFactoryConfig {
  approvalRegister: SOAPClientConfig;
  approvalCancel?: SOAPClientConfig;
  approvalDelegator?: SOAPClientConfig;
  // 추가 클라이언트 설정...
}

/**
 * SOAP 클라이언트 팩토리
 * 여러 WSDL 클라이언트를 중앙에서 관리
 */
export class SOAPClientFactory {
  private static instances = new Map<string, any>();
  private config: ClientFactoryConfig;

  constructor(config: ClientFactoryConfig) {
    this.config = config;
  }

  /**
   * 전자결재 기안 클라이언트 가져오기
   */
  async getApprovalRegisterClient(): Promise<ApprovalRegisterClient> {
    const key = 'approvalRegister';

    if (!SOAPClientFactory.instances.has(key)) {
      const client = new ApprovalRegisterClient(this.config.approvalRegister);
      await client.initialize();
      SOAPClientFactory.instances.set(key, client);
    }

    return SOAPClientFactory.instances.get(key)!;
  }

  /**
   * 전자결재 위임 클라이언트 가져오기
   */
  async getApprovalDelegatorClient(): Promise<ApprovalDelegatorClient> {
    const key = 'approvalDelegator';

    if (!this.config.approvalDelegator) {
      throw new Error('ApprovalDelegator 클라이언트 설정이 없습니다.');
    }

    if (!SOAPClientFactory.instances.has(key)) {
      const client = new ApprovalDelegatorClient(this.config.approvalDelegator);
      await client.initialize();
      SOAPClientFactory.instances.set(key, client);
    }

    return SOAPClientFactory.instances.get(key)!;
  }

  /**
   * 모든 클라이언트 초기화
   */
  async initializeAll(): Promise<void> {
    const tasks: Promise<any>[] = [this.getApprovalRegisterClient()];

    if (this.config.approvalDelegator) {
      tasks.push(this.getApprovalDelegatorClient());
    }

    await Promise.all(tasks);
    console.log('모든 SOAP 클라이언트가 초기화되었습니다.');
  }

  /**
   * 캐시된 인스턴스 초기화
   */
  static clearInstances(): void {
    SOAPClientFactory.instances.clear();
  }
}
