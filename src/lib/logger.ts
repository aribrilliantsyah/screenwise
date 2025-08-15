import winston from 'winston';
import path from 'path';

const logDir = 'logs';
const logFilePath = path.join(logDir, 'server.log');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new winston.transports.File({ filename: logFilePath }),
  ],
});

export default logger;