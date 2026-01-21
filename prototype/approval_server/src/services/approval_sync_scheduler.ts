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
    const approvals = await this.fetchWaitingApprovals(config.approval_client.sync_cycle_min);

    if (!approvals.length) {
      this.logger.info('Not exist sync approval target');
      return;
    }

    const hrUserList = await this.fetchUserInfoFromHR(approvals);
    const requestDtoList = this.buildRequestDtoList(approvals, hrUserList.data, config);

    if (requestDtoList.length) {
      await this.soap_register_client.execute(requestDtoList);
      this.logger.info('Success send request... list %s', JSON.stringify(requestDtoList));
    }
  }

  private async fetchWaitingApprovals(cycle: number) {
    return this.vsmgmt_client.getWaitingApprovalByCycle(cycle);
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

  private buildRequestDtoList(
    approvals: Array<WatingApprovalRes>,
    hrUsers: Array<UserInfo>,
    config: LoadedConfig,
  ): RequestAuto[] {
    return approvals
      .map((approval) => {
        try {
          const req = this.buildRequestDto(approval, hrUsers, config);
          return req;
        } catch (e: any) {
          this.logger.error(
            'Fail to build request for soap ... approval: %s, err: %s',
            JSON.stringify(approval),
            e.stack || e,
          );

          return null;
        }
      })
      .filter((r) => r != null);
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
      APPR_TITLE: approval.type,
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
