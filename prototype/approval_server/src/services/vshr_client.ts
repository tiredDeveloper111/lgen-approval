import { Config } from '../config';
import { AxiosWrapper } from './axios_wrapper';

export class UserInfoResponse {
  public success: boolean;
  public data: Array<UserInfo>;
}

export class UserInfo {
  id: string;
  name: string;
  deptId: string;
  positionId: string;
  positionName: string;
  emailAddress: string;
  empCode: string;
  createDate: string;
}
export class VshrClient {
  constructor(private readonly axiosWrapper: AxiosWrapper) {}

  public async getUserFromEmpCode(empCode: string[]): Promise<UserInfoResponse> {
    const vshrConfig = Config.getConfig().vshr;
    const uri = `/vshr/employee`;
    const query = encodeURIComponent(`{"empCode":${JSON.stringify(empCode)}}`);
    const encoded_uri = `?filter=${query}`;
    const url = `http://${vshrConfig.host}:${vshrConfig.port}${uri}${encoded_uri}`;

    const res = await this.axiosWrapper.get<UserInfoResponse>(url);

    return res.data;
  }
}
