import winston from 'winston';
import { Logger } from '../logger_decorator';
import { UserInfo, VshrClient } from './vshr_client';
import { VsmgmtClient, WatingApprovalRes } from './vsmgmt_client';
import { APPR_TYPE, ApprovalRegisterClient, RequestAuto } from './soap_clients';
import { Config, LoadedConfig } from '../config';
import _ from 'lodash';
import { HtmlContentsBuilder } from './html_contents_builder';

export class ApprovalSyncScheduler {
  @Logger('ApprovalSyncScheduler')
  private readonly logger: winston.Logger;
  constructor(
    private readonly vshr_client: VshrClient,
    private readonly vsmgmt_client: VsmgmtClient,
    private readonly soap_register_client: ApprovalRegisterClient,
  ) {}

  async asleep(msec: number) {
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), msec);
    });
  }

  public async start() {
    while (true) {
      const config = Config.getConfig();
      try {
        await this.processSyncCycle(config);
      } catch (e: any) {
        this.logger.error('Unexpected Error %s', e.stack || e);
      } finally {
        await this.asleep(config.approval_client.sync_cycle_min * 60 * 1000);
      }
    }
  }

  private async processSyncCycle(config: LoadedConfig) {
    const approvals = await this.fetchWaitingApprovals();

    if (!approvals.length) {
      this.logger.info('Not exist sync approval target');
      return;
    }

    const hrUserList = await this.fetchUserInfoFromHR(approvals);

    for (const approval of approvals) {
      await this.syncSingleApproval(approval, hrUserList.data, config);
    }
  }

  private async syncSingleApproval(
    approval: WatingApprovalRes,
    hrUsers: Array<UserInfo>,
    config: LoadedConfig,
  ): Promise<void> {
    const syncSuccess = await this.registerToSoap(approval, hrUsers, config);
    await this.postSyncResultToVsmgmt(approval.id, syncSuccess);
  }

  private async registerToSoap(
    approval: WatingApprovalRes,
    hrUsers: Array<UserInfo>,
    config: LoadedConfig,
  ): Promise<boolean> {
    try {
      const requestDto = this.buildRequestDto(approval, hrUsers, config);
      this.logger.info('Sending single SOAP request for approval ID: %s', approval.id);

      const response = await this.soap_register_client.sendSingle(requestDto);
      const isSuccess = response?.IF_STATUS === 'S';

      if (isSuccess) {
        this.logger.info(
          'Success send request to SOAP for approval ID: %s. Response: %s',
          approval.id,
          JSON.stringify(response),
        );
      } else {
        this.logger.warn(
          'Fail to register SOAP for approval ID: %s. Response: %s',
          approval.id,
          JSON.stringify(response),
        );
      }
      return isSuccess;
    } catch (e: any) {
      this.logger.error(
        'Error during SOAP registration for approval ID: %s. Error: %s',
        approval.id,
        e.stack || e,
      );
      return false;
    }
  }

  private async postSyncResultToVsmgmt(approvalId: string, syncSuccess: boolean): Promise<void> {
    try {
      await this.vsmgmt_client.postSyncResult({
        approvalId,
        syncSuccess,
      });
      this.logger.info(
        'Successfully posted sync result to vsmgmt for approval ID: %s with success=%s',
        approvalId,
        syncSuccess,
      );
    } catch (e: any) {
      this.logger.error(
        'Failed to post sync result to vsmgmt for approval ID: %s. Error: %s',
        approvalId,
        e.stack || e,
      );
    }
  }

  private async fetchWaitingApprovals() {
    return this.vsmgmt_client.getWaitingApprovals();
  }

  private async fetchUserInfoFromHR(approvals: WatingApprovalRes[]) {
    const uniqueUserIds = this.extractUniqueUserIds(approvals);
    const hrUserList = await this.vshr_client.getUserFromId(uniqueUserIds);

    if (!hrUserList.success) {
      throw new Error(`Fail to get user info in hr [${uniqueUserIds.slice(0, 3).join(',')}...]`);
    }

    return hrUserList;
  }

  private extractUniqueUserIds(approvals: Array<WatingApprovalRes>): string[] {
    const approverIds = approvals.flatMap((approval) =>
      approval.apprLine.map((line) => line.approverId),
    );
    const applicantIds = approvals.map((approval) => approval.applicant);
    return _.uniq([...approverIds, ...applicantIds]);
  }

  private buildTitle(type: string): string {
    switch (type) {
      case 'approval.types.create-vd':
        return `[ESML EnCloud] VD 생성`;
      case 'approval.types.reset-vd':
        return `[ESML EnCloud] VD 재설정`;
      case 'approval.types.delete-vd':
        return `[ESML EnCloud] VD 삭제`;
      case 'approval.types.access-from-external-network':
        return `[ESML EnCloud] 외부망접속 사용신청`;
      default:
        throw new Error(`Not supported type ${type}`);
    }
  }

  private buildRequestDto(
    approval: WatingApprovalRes,
    hrUsers: Array<UserInfo>,
    config: LoadedConfig,
  ): RequestAuto {
    const sortedApprLine = approval.apprLine.sort((a, b) => a.level - b.level);
    const approverIds = sortedApprLine.map((line) => line.approverId);

    const requesterEmpCode = this.findEmpCode(hrUsers, approval.applicant);
    const approvalTypes = this.buildApprovalTypes(approval.applicant, approverIds);
    const approverEmpCodes = this.buildApproverEmpCodes(approverIds, hrUsers);
    const formEditorData = HtmlContentsBuilder.buildContents(approval);

    return {
      APPKEY_01: approval.id,
      SYSTEM_ID: config.system.system_id,
      FORM_ID: config.system.form_id,
      APPR_TITLE: this.buildTitle(approval.type),
      REQ_USER: requesterEmpCode,
      APPR_SECURITY_TYPE: '0',
      NEXT_APPR_TYPE: approvalTypes.join(';'),
      NEXT_APPROVER: approverEmpCodes,
      FORM_EDITOR_DATA: formEditorData,
    } as RequestAuto;
  }

  private findEmpCode(hrUsers: Array<UserInfo>, userId: string): string {
    const user = hrUsers.find((u) => u.id.toLowerCase() === userId.toLowerCase());

    if (!user) {
      throw new Error(`User not found in HR system: ${userId}`);
    }

    if (!user.empCode) {
      throw new Error(`Employee code not found for user: ${userId}`);
    }

    return user.empCode;
  }

  private buildApprovalTypes(applicantId: string, approverIds: string[]): APPR_TYPE[] {
    const types = approverIds.map(() => APPR_TYPE.APPROVAL);

    if (applicantId.toLowerCase() === approverIds[0]?.toLowerCase()) {
      types[0] = APPR_TYPE.SELF;
    }

    return types;
  }

  private buildApproverEmpCodes(approverIds: string[], hrUsers: Array<UserInfo>): string {
    return approverIds.map((id) => this.findEmpCode(hrUsers, id)).join(';');
  }
}
