/**
 * Opciones de configuración para el cliente de Boatsetter
 */
export interface BoatsetterClientOptions {
    /** Si el navegador se debe ejecutar en modo headless */
    headless?: boolean;
    /** URL base para la API de Boatsetter */
    baseUrl?: string;
    /** Tiempo máximo de espera para operaciones (en ms) */
    timeout?: number;
    /** Opción para habilitar logs detallados */
    verbose?: boolean;
}

/**
 * Estructura para credenciales de usuario
 */
export interface BoatsetterCredentials {
    /** Correo electrónico de usuario */
    email: string;
    /** Contraseña de usuario */
    password: string;
}

/**
 * Resultado de operación de login
 */
export interface LoginResult {
    /** Si el login fue exitoso */
    success: boolean;
    /** Mensaje informativo */
    message: string;
    /** Información adicional (puede incluir datos de usuario si el login es exitoso) */
    data?: Record<string, any>;
}