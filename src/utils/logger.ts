/**
 * Niveles de log disponibles
 */
export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}

/**
 * Clase simple para manejo de logs
 */
export class Logger {
    constructor(
        private context: string,
        private level: LogLevel = LogLevel.INFO
    ) {}

    /**
     * Log de nivel error
     */
    error(message: string, ...args: any[]): void {
        if (this.level >= LogLevel.ERROR) {
            console.error(`[ERROR][${this.context}] ${message}`, ...args);
        }
    }

    /**
     * Log de nivel advertencia
     */
    warn(message: string, ...args: any[]): void {
        if (this.level >= LogLevel.WARN) {
            console.warn(`[WARN][${this.context}] ${message}`, ...args);
        }
    }

    /**
     * Log de nivel informativo
     */
    info(message: string, ...args: any[]): void {
        if (this.level >= LogLevel.INFO) {
            console.info(`[INFO][${this.context}] ${message}`, ...args);
        }
    }

    /**
     * Log de nivel debug
     */
    debug(message: string, ...args: any[]): void {
        if (this.level >= LogLevel.DEBUG) {
            console.debug(`[DEBUG][${this.context}] ${message}`, ...args);
        }
    }

    /**
     * Cambiar el nivel de log
     */
    setLevel(level: LogLevel): void {
        this.level = level;
    }
}

/**
 * Crear una instancia de logger con contexto
 */
export function createLogger(context: string, level?: LogLevel): Logger {
    return new Logger(context, level);
}

export default createLogger;