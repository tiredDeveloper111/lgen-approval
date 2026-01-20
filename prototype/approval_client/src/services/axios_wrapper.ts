import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

import QueryString from 'qs';
import winston from 'winston';
import { Logger } from '../logger_decorator';

export class AxiosWrapper {
  @Logger('AxiosWrapper')
  private readonly logger: winston.Logger;
  private readonly request: AxiosInstance;

  constructor() {
    this.request = axios.create({
      timeout: 3 * 1000,
      paramsSerializer: (params) => QueryString.stringify(params),
    });
  }

  public async get<T = any>(url: string, config?: AxiosRequestConfig<any>) {
    return this.callAxios<T>('get', [url, config]);
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig<any>) {
    return this.callAxios<T>('post', [url, data, config]);
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig<any>) {
    return this.callAxios<T>('put', [url, data, config]);
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig<any>) {
    return this.callAxios<T>('patch', [url, data, config]);
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig<any>) {
    return this.callAxios<T>('delete', [url, config]);
  }

  private async callAxios<T>(
    method: 'post' | 'get' | 'patch' | 'put' | 'delete',
    args: any[],
  ): Promise<AxiosResponse<T, any>> {
    try {
      const startTime = new Date().getTime();

      const result = await this.request[method]<T>(args[0], args[1], args[2]);
      this.logger.info(
        `Request to ${method.toUpperCase()} ${args[0]} status: ${result.status}, ${new Date().getTime() - startTime}ms`,
      );

      return result;
    } catch (e) {
      if (e instanceof AxiosError) {
        return this.handleAxiosError(`${method.toLocaleUpperCase()} ${args[0]}`, e);
      }
      throw e;
    }
  }

  private handleAxiosError(requestedAPI: string, err: AxiosError) {
    const { message = '', response } = err;

    const logMsg = `${requestedAPI} ${message}`;

    !response?.status || response.status >= 500
      ? this.logger.error(`${logMsg} %s`, err.stack || err)
      : this.logger.info(logMsg);

    return err.response as AxiosResponse<any, any>;
  }
}
