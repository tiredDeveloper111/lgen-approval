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

export type DeleteVdContents = Required<VdContents>;

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
  id: string; // 서비스 신청 id
  type: string;
  applicant: string; // 신청자
  applicantName: string; // 신청자 이름
  user: string; // 사용자
  userName: string; // 사용자 이름
  userOrganization: string; // 사용자 부서
  reason: string; // 신청 사유
  contents: ResetVdContents | DeleteVdContents | ExternalNetContents | CreateVdContents;
  jobScheduleDate: string;
  apprLine: Array<{ level: number; approverId: string }>;
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

  public async getWaitingApprovalByCycle(cycle_min: number): Promise<Array<WatingApprovalRes>> {
    const vsmgmtConfig = Config.getConfig().vsmgmt;
    const uri = `/mgmt/api/approval/waiting?beforeMin=${cycle_min}`;
    const url = `http://${vsmgmtConfig.host}:${vsmgmtConfig.port}${uri}`;

    const res = await this.axiosWrapper.get<Array<WatingApprovalRes>>(url);

    if (res.status !== 200) {
      throw new Error(`Fail to post process result to vsmgmt`);
    }

    return res.data;
  }
}
