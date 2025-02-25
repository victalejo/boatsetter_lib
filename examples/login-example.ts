import { BoatsetterClient } from '../src/lib';
import { defaultConfig } from '../src/config/default';
import { createLogger, LogLevel } from '../src/utils/logger';
import * as dotenv from 'dotenv';

// Cargar variables de entorno (credenciales)
dotenv.config();

// Crear logger
const logger = createLogger('LoginExample', LogLevel.DEBUG);

/**
 * Ejemplo de uso del módulo de login
 */
async function runLoginExample() {
    logger.info('Iniciando ejemplo de login en Boatsetter');

    // Verificar que existen las credenciales
    const email = "adalbertomarte@yahoo.com";
    const password = "boat123";

    if (!email || !password) {
        logger.error('Credenciales no encontradas. Asegúrate de crear un archivo .env con BOATSETTER_EMAIL y BOATSETTER_PASSWORD');
        return;
    }

    // Crear una instancia del cliente
    const client = new BoatsetterClient({
        ...defaultConfig,
        headless: process.env.HEADLESS === 'true',
        verbose: process.env.VERBOSE === 'true',
        timeout: parseInt(process.env.TIMEOUT || '30000')
    });

    try {
        // Inicializar el cliente
        logger.info('Inicializando el cliente...');
        await client.initialize();

        // Intentar hacer login
        logger.info(`Intentando login con usuario: ${email}`);
        const loginResult = await client.login({ email, password });

        // Mostrar resultado
        if (loginResult.success) {
            logger.info('✅ Login exitoso!');

            // Navegar al dashboard de propietario
            logger.info('Navegando al dashboard de propietario...');
            await client.navigateToOwnerDashboard();

            // Obtener lista de barcos
            logger.info('Obteniendo lista de barcos...');
            const boats = await client.getBoatsList();

            logger.info(`Se encontraron ${boats.length} barcos:`);
            boats.forEach((boat, index) => {
                logger.info(`${index + 1}. ${boat.title} (ID: ${boat.id}, Estado: ${boat.status})`);
            });

            // Si hay barcos, navegar al calendario del primero
            if (boats.length > 0) {
                const firstBoat = boats[0];
                logger.info(`Navegando al calendario del barco: ${firstBoat.title}`);
                await client.navigateToBoatCalendar(firstBoat.id);

                logger.info('Esperando 5 segundos para visualizar el calendario...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        } else {
            logger.error(`❌ Login fallido: ${loginResult.message}`);
        }

        // Esperar un poco para ver el resultado (solo para demostración)
        logger.info('Esperando 3 segundos antes de cerrar...');
        await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
        logger.error('Error durante la ejecución del ejemplo:', error);
    } finally {
        // Cerrar el cliente
        logger.info('Cerrando el cliente...');
        await client.close();
        logger.info('Ejemplo finalizado');
    }
}

// Ejecutar el ejemplo
runLoginExample().catch(error => {
    console.error('Error no controlado:', error);
    process.exit(1);
});