import { BoatsetterClientOptions } from  '../lib/interfaces';

/**
 * Configuración por defecto para el cliente de Boatsetter
 */
export const defaultConfig: BoatsetterClientOptions = {
    headless: false,
    baseUrl: 'https://www.boatsetter.com',
    timeout: 30000,
    verbose: true
};

export default defaultConfig;