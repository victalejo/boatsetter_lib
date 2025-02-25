import { BoatsetterClient } from '../boatsetter-client';
import { Boat, BoatAvailability } from '../interfaces';
import { createLogger, LogLevel } from '../../utils/logger';

/**
 * Servicio para gestionar operaciones relacionadas con barcos
 */
export class BoatService {
    private logger = createLogger('BoatService', LogLevel.INFO);

    /**
     * Constructor del servicio
     * @param client Cliente de Boatsetter inicializado y con sesión activa
     */
    constructor(private client: BoatsetterClient) {}

    /**
     * Obtiene todos los barcos del propietario
     * @returns Promise<Boat[]> Lista de barcos
     */
    async getBoats(): Promise<Boat[]> {
        this.logger.info('Obteniendo lista de barcos...');
        return await this.client.getBoatsList();
    }

    /**
     * Obtiene un barco específico por su ID
     * @param boatId ID del barco
     * @returns Promise<Boat|null> Información del barco o null si no se encuentra
     */
    async getBoatById(boatId: string): Promise<Boat|null> {
        this.logger.info(`Buscando barco con ID: ${boatId}`);
        const boats = await this.client.getBoatsList();
        const boat = boats.find(b => b.id === boatId);

        if (!boat) {
            this.logger.warn(`Barco con ID ${boatId} no encontrado`);
            return null;
        }

        return boat;
    }

    /**
     * Activa un barco
     * @param boatId ID del barco
     * @returns Promise<boolean> Resultado de la operación
     */
    async activateBoat(boatId: string): Promise<boolean> {
        this.logger.info(`Activando barco ${boatId}...`);
        return await this.client.toggleBoatStatus(boatId, true);
    }

    /**
     * Desactiva un barco
     * @param boatId ID del barco
     * @returns Promise<boolean> Resultado de la operación
     */
    async deactivateBoat(boatId: string): Promise<boolean> {
        this.logger.info(`Desactivando barco ${boatId}...`);
        return await this.client.toggleBoatStatus(boatId, false);
    }

    /**
     * Configura la disponibilidad para un día específico
     * @param boatId ID del barco
     * @param date Fecha en formato YYYY-MM-DD
     * @param availability Configuración de disponibilidad
     * @returns Promise<boolean> Resultado de la operación
     */
    async setDayAvailability(boatId: string, date: string, availability: BoatAvailability): Promise<boolean> {
        this.logger.info(`Configurando disponibilidad para ${boatId} en fecha ${date}...`);
        return await this.client.setDateAvailability(boatId, date, availability);
    }

    /**
     * Configura la disponibilidad para un rango de fechas
     * @param boatId ID del barco
     * @param startDate Fecha de inicio en formato YYYY-MM-DD
     * @param endDate Fecha de fin en formato YYYY-MM-DD
     * @param availability Configuración de disponibilidad
     * @returns Promise<boolean> Resultado de la operación
     */
    async setRangeAvailability(
        boatId: string,
        startDate: string,
        endDate: string,
        availability: BoatAvailability
    ): Promise<boolean> {
        this.logger.info(`Configurando disponibilidad para ${boatId} desde ${startDate} hasta ${endDate}...`);
        return await this.client.setDateRangeAvailability(boatId, startDate, endDate, availability);
    }

    /**
     * Bloquea un día completo para un barco
     * @param boatId ID del barco
     * @param date Fecha a bloquear en formato YYYY-MM-DD
     * @returns Promise<boolean> Resultado de la operación
     */
    async blockDay(boatId: string, date: string): Promise<boolean> {
        this.logger.info(`Bloqueando día ${date} para barco ${boatId}...`);
        return await this.client.setDateAvailability(boatId, date, {
            isAvailable: false
        });
    }

    /**
     * Aplica un descuento o aumento de precio para un día específico
     * @param boatId ID del barco
     * @param date Fecha en formato YYYY-MM-DD
     * @param percentage Porcentaje de ajuste (-100 a 100)
     * @returns Promise<boolean> Resultado de la operación
     */
    async adjustDayPrice(boatId: string, date: string, percentage: number): Promise<boolean> {
        if (percentage < -100 || percentage > 100) {
            this.logger.error('El porcentaje debe estar entre -100 y 100');
            return false;
        }

        this.logger.info(`Ajustando precio para ${date} en ${percentage}%`);
        return await this.client.setDateAvailability(boatId, date, {
            isAvailable: true,
            priceAdjustment: percentage
        });
    }

    /**
     * Bloquea un rango horario específico en un día
     * @param boatId ID del barco
     * @param date Fecha en formato YYYY-MM-DD
     * @param fromTime Hora de inicio en formato "HH:MM"
     * @param toTime Hora de fin en formato "HH:MM"
     * @returns Promise<boolean> Resultado de la operación
     */
    async blockTimeRange(
        boatId: string,
        date: string,
        fromTime: string,
        toTime: string
    ): Promise<boolean> {
        this.logger.info(`Bloqueando horario de ${fromTime} a ${toTime} en fecha ${date}...`);
        return await this.client.setDateAvailability(boatId, date, {
            isAvailable: true,
            unavailableTimeRanges: [{ from: fromTime, to: toTime }]
        });
    }

    /**
     * Bloquea múltiples rangos horarios en un día
     * @param boatId ID del barco
     * @param date Fecha en formato YYYY-MM-DD
     * @param timeRanges Array de rangos horarios a bloquear [{from, to}]
     * @returns Promise<boolean> Resultado de la operación
     */
    async blockMultipleTimeRanges(
        boatId: string,
        date: string,
        timeRanges: Array<{from: string, to: string}>
    ): Promise<boolean> {
        if (!timeRanges || timeRanges.length === 0) {
            this.logger.error('Debe proporcionar al menos un rango de tiempo');
            return false;
        }

        this.logger.info(`Bloqueando ${timeRanges.length} rangos horarios en fecha ${date}...`);
        return await this.client.setDateAvailability(boatId, date, {
            isAvailable: true,
            unavailableTimeRanges: timeRanges
        });
    }

    /**
     * Obtiene los barcos activos del propietario
     * @returns Promise<Boat[]> Lista de barcos activos
     */
    async getActiveBoats(): Promise<Boat[]> {
        this.logger.info('Obteniendo barcos activos...');
        const boats = await this.client.getBoatsList();
        return boats.filter(boat => boat.status === 'active');
    }

    /**
     * Obtiene los barcos inactivos del propietario
     * @returns Promise<Boat[]> Lista de barcos inactivos
     */
    async getInactiveBoats(): Promise<Boat[]> {
        this.logger.info('Obteniendo barcos inactivos...');
        const boats = await this.client.getBoatsList();
        return boats.filter(boat => boat.status === 'inactive');
    }

    /**
     * Configura un precio especial para una duración específica en un día
     * @param boatId ID del barco
     * @param date Fecha en formato YYYY-MM-DD
     * @param duration Duración en horas (2, 3, 4, 6, 8)
     * @param price Precio nuevo
     * @returns Promise<boolean> Resultado de la operación
     */
    async setSpecialPrice(
        boatId: string,
        date: string,
        duration: 2 | 3 | 4 | 6 | 8,
        price: number
    ): Promise<boolean> {
        this.logger.info(`Configurando precio especial para ${duration} horas en fecha ${date}...`);

        // Esta funcionalidad requeriría una implementación específica en el BoatsetterClient
        // Para este ejemplo, simplemente mostramos un mensaje de advertencia
        this.logger.warn('La funcionalidad de precio especial por duración no está implementada');
        return false;
    }
}