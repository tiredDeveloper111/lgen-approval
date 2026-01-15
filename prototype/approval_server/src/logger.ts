import winston from 'winston';

const LOGGER_CONFIG = {
  level: 'debug',

  timestampFormat: ['ja', { timeZone: 'Asia/Seoul' }],

  transports: [
    {
      filename:
        process.env.NODE_ENV === 'production'
          ? `/approval_server/logs/error.log`
          : `${__dirname}/logs/error.log`,
      level: 'error',
    },
    {
      filename:
        process.env.NODE_ENV === 'production'
          ? `/approval_server/logs/info.log`
          : `${__dirname}/logs/info.log`,
    },
  ],
};
/** winston logger를 사용한다. singleton 패턴을 사용하여 로거는 메모리 낭비를 줄인다. */
/** 각 클래스에서 logger가 필요할 시 해당 로거의 getLogger(className)으로 호출하여 사용한다. */
export class LoggerFactory {
  private static loggerMap = new Map<string, winston.Logger>();

  /**
   * 로거 생성을 위한 설정을 반환한다.
   * @returns
   */
  private static getLoggerSetting(loggerLabel: string) {
    const { format } = winston;

    const config = {
      level: LOGGER_CONFIG.level,
      timestampFormat: LOGGER_CONFIG.timestampFormat,
      transports: LOGGER_CONFIG.transports as Array<Record<string, any>>,
    };

    const formatLine = format.printf(({ level, message, timestamp, label }) => {
      return `${timestamp} ${level}: [${label}] ${message}`;
    });

    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: () =>
          `${new Date().toLocaleString(
            config.timestampFormat[0] as Intl.LocalesArgument,
            config.timestampFormat[1] as Intl.DateTimeFormatOptions,
          )}`,
      }),
      winston.format.label({ label: loggerLabel }),

      winston.format.splat(),
      formatLine,
    );

    return { logConfig: config, logFormat };
  }

  /**
   * label 별 로거를 반환한다.
   * @param label : 모듈별 로거 키
   * @returns
   */
  public static getLogger(label: string): winston.Logger {
    if (this.loggerMap.has(label)) {
      return this.loggerMap.get(label) as winston.Logger;
    }

    const levels = {
      error: 0,
      alert: 1,
      warn: 2,
      info: 3,
      verbose: 4,
      debug: 5,
      silly: 6,
    };

    const { logConfig, logFormat } = this.getLoggerSetting(label);

    const logger = winston.createLogger({
      levels,
      level: logConfig.level,
      format: logFormat,
      transports: logConfig.transports.map((spec) => new winston.transports.File(spec)),
    });

    if (process.env.NODE_ENV !== 'production') {
      logger.add(new winston.transports.Console({ format: logFormat }));
    }

    this.loggerMap.set(label, logger);

    return logger;
  }
}
