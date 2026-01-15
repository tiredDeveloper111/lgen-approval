import fs from 'fs';
import YAML from 'yaml';

class YmlWrapper {
  public static loadYml<T>(ymlpath: string) {
    if (!fs.existsSync(ymlpath)) {
      throw new Error(`Not exist yml file ${ymlpath}`);
    }

    const loadedYml = YAML.parse(fs.readFileSync(ymlpath, 'utf-8'));

    return loadedYml as T;
  }
}

class LoadedConfig {
  public system: {
    system_id: string;
  };
  public server: {
    port: number;
    host: string;
  };
  public vsmgmt: {
    host: string;
    port: number;
  };
  public vshr: {
    host: string;
    port: number;
  };
  public wsdl: {
    path: string;
  };
}

export class Config {
  private static configPath = process.env.CONFIG_PATH || './config.yaml';
  private static loadedConfig: LoadedConfig;

  public static reload() {
    try {
      this.loadedConfig = YmlWrapper.loadYml(this.configPath);

      console.log('Success reload config.');
    } catch (e) {
      console.error('Fail to reload config...', (e as Error).stack || e);
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
