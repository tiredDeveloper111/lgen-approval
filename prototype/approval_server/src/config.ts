import fs from 'fs';
import YAML from 'yaml';
import { LoggerFactory } from './logger';

class YmlWrapper {
  public static loadYml<T>(ymlpath: string) {
    if (!fs.existsSync(ymlpath)) {
      throw new Error(`Not exist yml file ${ymlpath}`);
    }

    const loadedYml = YAML.parse(fs.readFileSync(ymlpath, 'utf-8'));

    return loadedYml as T;
  }
}

export class LoadedConfig {
  public system: {
    system_id: string;
    form_id: string;
  };
  public approval_server: {
    host: string;
    listen_port: number;
    service_port: number;
    wsdl_path: string;
  };
  public approval_client: {
    sync_cycle_min: number;
    username: string;
    password: string;
    register: {
      wsdl: string;
      endpoint: string;
    };
    delegator: {
      wsdl: string;
      endpoint: string;
    };
  };
  public vsmgmt: {
    host: string;
    port: number;
  };
  public vshr: {
    host: string;
    port: number;
  };
}

export class Config {
  private static configPath = process.env.CONFIG_PATH || './config.yaml';
  private static loadedConfig: LoadedConfig;
  private static logger = LoggerFactory.getLogger('Config');

  public static reload() {
    try {
      this.loadedConfig = YmlWrapper.loadYml(this.configPath);

      this.logger.info('Succes reload config %s', this.configPath);
    } catch (e) {
      this.logger.error('Fail to reload config... %s', (e as Error).stack || e);
    }
  }

  public static getConfig(): LoadedConfig {
    if (!this.loadedConfig) {
      this.reload();
    }

    return this.loadedConfig;
  }
}

export class ConfigReloader {
  public static async asleep(msec: number) {
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), msec);
    });
  }

  public static async start() {
    while (true) {
      Config.reload();

      await this.asleep(60 * 1000);
    }
  }
}
