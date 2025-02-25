import { BoatsetterClient } from '../src/lib';
import { BoatService } from '../src/lib/services/boat-service';
import { defaultConfig } from '../src/config/default';
import { createLogger, LogLevel } from '../src/utils/logger';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Crear logger
const logger = createLogger('BloqueoReservasEjemplo', LogLevel.DEBUG);

/**
 * Ejemplo de cómo bloquear diferentes tipos de reservas en Boatsetter
 * utilizando los selectores correctos y métodos optimizados
 */
async function ejecutarEjemploBloqueoReservas() {
    logger.info('Iniciando ejemplo de bloqueo de reservas en Boatsetter');

    // Verificar que existen las credenciales
    const email = process.env.BOATSETTER_EMAIL;
    const password = process.env.BOATSETTER_PASSWORD;

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

        // Iniciar sesión
        logger.info(`Intentando login con usuario: ${email}`);
        const loginResult = await client.login({ email, password });

        if (!loginResult.success) {
            logger.error(`❌ Login fallido: ${loginResult.message}`);
            return;
        }

        logger.info('✅ Login exitoso!');

        // Obtener lista de barcos
        logger.info('Obteniendo lista de barcos...');
        const boats = await client.getBoatsList();

        if (boats.length === 0) {
            logger.warn('No se encontraron barcos en la cuenta.');
            return;
        }

        // Seleccionar el primer barco
        const barcoSeleccionado = boats[0];
        logger.info(`Seleccionado barco: ${barcoSeleccionado.title} (ID: ${barcoSeleccionado.id})`);

        // Crear servicio de barcos
        const boatService = new BoatService(client);

        // EJEMPLO 1: Bloquear un día completo en el mes actual (febrero)
        logger.info('\n--- EJEMPLO 1: Bloquear un día completo ---');

        // Día 28 de febrero 2025
        const fechaBloqueo = new Date(2025, 1, 28);
        const fechaBloqueoStr = fechaBloqueo.toISOString().split('T')[0];

        logger.info(`Bloqueando día completo: ${fechaBloqueoStr}`);
        const resultadoDiaCompleto = await boatService.blockDay(barcoSeleccionado.id, fechaBloqueoStr);

        if (resultadoDiaCompleto) {
            logger.info(`✅ Día ${fechaBloqueoStr} bloqueado exitosamente`);
        } else {
            logger.error(`❌ Error al bloquear el día ${fechaBloqueoStr}`);
        }

        // Esperar para visualizar el resultado
        await new Promise(resolve => setTimeout(resolve, 2000));

        // EJEMPLO 2: Bloquear un rango horario específico
        logger.info('\n--- EJEMPLO 2: Bloquear un rango horario específico ---');

        // Día 27 de febrero 2025
        const fechaRangoHorario = new Date(2025, 1, 27);
        const fechaRangoHorarioStr = fechaRangoHorario.toISOString().split('T')[0];

        // Horario a bloquear: 10:00 - 14:00
        const horaInicio = '10:00';
        const horaFin = '14:00';

        logger.info(`Bloqueando rango horario ${horaInicio} a ${horaFin} en fecha ${fechaRangoHorarioStr}`);
        const resultadoRangoHorario = await boatService.blockTimeRange(
            barcoSeleccionado.id,
            fechaRangoHorarioStr,
            horaInicio,
            horaFin
        );

        if (resultadoRangoHorario) {
            logger.info(`✅ Rango horario bloqueado exitosamente`);
        } else {
            logger.error(`❌ Error al bloquear el rango horario`);
        }

        // Esperar para visualizar el resultado
        await new Promise(resolve => setTimeout(resolve, 2000));

        // EJEMPLO 3: Navegar a otro mes y bloquear un día
        logger.info('\n--- EJEMPLO 3: Navegar a otro mes y bloquear un día ---');

        // Día 15 de marzo 2025
        const fechaOtroMes = new Date(2025, 2, 15);
        const fechaOtroMesStr = fechaOtroMes.toISOString().split('T')[0];

        logger.info(`Bloqueando día en otro mes: ${fechaOtroMesStr}`);
        const resultadoOtroMes = await boatService.blockDay(barcoSeleccionado.id, fechaOtroMesStr);

        if (resultadoOtroMes) {
            logger.info(`✅ Día ${fechaOtroMesStr} bloqueado exitosamente`);
        } else {
            logger.error(`❌ Error al bloquear el día ${fechaOtroMesStr}`);
        }

        // Esperar para visualizar el resultado
        await new Promise(resolve => setTimeout(resolve, 2000));

        // EJEMPLO 4: Bloquear múltiples rangos horarios en un mismo día
        logger.info('\n--- EJEMPLO 4: Bloquear múltiples rangos horarios ---');

        // Día 16 de marzo 2025
        const fechaMultiplesRangos = new Date(2025, 2, 16);
        const fechaMultiplesRangosStr = fechaMultiplesRangos.toISOString().split('T')[0];

        // Definir los rangos horarios a bloquear
        const rangosHorarios = [
            { from: '08:00', to: '10:00' },  // Bloqueo de mañana
            { from: '12:00', to: '14:00' },  // Bloqueo de mediodía
            { from: '17:00', to: '19:00' }   // Bloqueo de tarde
        ];

        logger.info(`Bloqueando ${rangosHorarios.length} rangos horarios en fecha ${fechaMultiplesRangosStr}`);
        const resultadoMultiplesRangos = await boatService.blockMultipleTimeRanges(
            barcoSeleccionado.id,
            fechaMultiplesRangosStr,
            rangosHorarios
        );

        if (resultadoMultiplesRangos) {
            logger.info(`✅ Rangos horarios múltiples bloqueados exitosamente`);
        } else {
            logger.error(`❌ Error al bloquear los rangos horarios múltiples`);
        }

        // Esperar para visualizar los resultados finales
        logger.info('\nEsperando 5 segundos para visualizar todos los cambios...');
        await new Promise(resolve => setTimeout(resolve, 5000));

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
ejecutarEjemploBloqueoReservas().catch(error => {
    console.error('Error no controlado:', error);
    process.exit(1);
});