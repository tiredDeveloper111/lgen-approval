import { Config } from '../config';
import { AxiosWrapper } from './axios_wrapper';

export class ProcessResultReq {
  public requestId: string; // 서비스 신청 ID
  public approverId: string; // 결재자
  public result: string;
  public comment: string;
  public apprDate: string;
  public approverName: string;
}

export class SyncResultReq {
  public approvalId: string; // 동기화 대상 결재 고유 ID
  public syncSuccess: boolean; // 동기화 성공 여부
}

class VdContents {
  vdName: string;
  disk: number; // gb
  vdGroupName: string;
  createDate: string;
  os: string;
  version: string;
  flavorName: string;
  cpus: number;
  ram: number; // mb
}
export type ResetVdContents = VdContents;

export type DeleteVdContents = VdContents;

export class ExternalNetContents {
  userId: string;
  userName: string;
  organization: string;
  applicant: string;
  applicantName: string;
  startDate: string;
  endDate: string;
  networkScope: string;
  reason: string;
}

export class CreateVdContents {
  flavorName: string;
  vdGroupName: string;
  ownDesktop: Array<VdContents>;
  expirationDate: string;
  disk: number; // GB,
  cpus: number; // core,
  ram: number; // mb
}

export class WatingApprovalRes {
  public id: string; // 서비스 신청 id
  public type: string;
  public applicant: string; // 신청자
  public applicantName: string; // 신청자 이름
  public user: string; // 사용자
  public userName: string; // 사용자 이름
  public userOrganization: string; // 사용자 부서
  public reason: string; // 신청 사유
  public contents:
    | [ResetVdContents]
    | [DeleteVdContents]
    | [ExternalNetContents]
    | [CreateVdContents];
  public jobScheduleDate: string;
  public isSyncExternal?: number;
  public apprLine: Array<{ level: number; approverId: string }>;
}

export class VsmgmtClient {
  constructor(private readonly axiosWrapper: AxiosWrapper) {}

  public async postProcessResult(req: ProcessResultReq): Promise<void> {
    const vsmgmtConfig = Config.getConfig().vsmgmt;
    const uri = `/mgmt/api/approval/process-result`;

    const url = `http://${vsmgmtConfig.host}:${vsmgmtConfig.port}${uri}`;

    const res = await this.axiosWrapper.post(url, req);

    if (res.status !== 200) {
      throw new Error(`Fail to post process result to vsmgmt`);
    }
  }

  public async getWaitingApprovals(): Promise<Array<WatingApprovalRes>> {
    const vsmgmtConfig = Config.getConfig().vsmgmt;
    const uri = `/mgmt/api/approval/waiting`;
    const url = `http://${vsmgmtConfig.host}:${vsmgmtConfig.port}${uri}`;

    const res = await this.axiosWrapper.get<Array<WatingApprovalRes>>(url);

    if (res.status !== 200) {
      throw new Error(`Fail to get waiting approvals from vsmgmt`);
    }

    return res.data;
  }

  public async postSyncResult(req: SyncResultReq): Promise<void> {
    const vsmgmtConfig = Config.getConfig().vsmgmt;
    const uri = `/mgmt/api/approval/sync-result`;
    const url = `http://${vsmgmtConfig.host}:${vsmgmtConfig.port}${uri}`;

    const res = await this.axiosWrapper.post(url, req);

    if (res.status !== 200) {
      throw new Error(`Fail to post sync result to vsmgmt`);
    }
  }
}
