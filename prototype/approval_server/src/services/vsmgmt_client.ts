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

export class VsmgmtClient {
  constructor(private readonly axiosWrapper: AxiosWrapper) {}

  public async postProcessResult(req: ProcessResultReq): Promise<void> {
    const vsmgmtConfig = Config.getConfig().vsmgmt;
    const uri = `/mgmt/api/approval/process-result`;

    const url = `http://${vsmgmtConfig.host}:${vsmgmtConfig.port}${uri}`;

    const res = await this.axiosWrapper.post(url, req);

    console.log(res);

    if (res.status !== 200) {
      throw new Error(`Fail to post process result to vsmgmt`);
    }
  }
}
