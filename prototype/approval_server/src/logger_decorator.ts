import { LoggerFactory } from './logger';

export function Logger(label: string) {
  return (target: any, propertyKey: string) => {
    // eslint-disable-next-line no-param-reassign
    target[propertyKey] = LoggerFactory.getLogger(label);
  };
}
