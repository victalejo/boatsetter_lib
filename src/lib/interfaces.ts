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

/**
 * Estructura que representa un barco en la plataforma
 */
export interface Boat {
    /** ID único del barco */
    id: string;
    /** Título/nombre del barco */
    title: string;
    /** URL relativa del barco */
    url: string;
    /** Estado actual (active/inactive) */
    status: string;
    /** URL de la imagen principal */
    imageUrl: string;
    /** Número de visualizaciones */
    views: number;
    /** Si tiene Instant Book habilitado */
    isInstantBookEnabled: boolean;
    /** Si es gestionado */
    isManaged: boolean;
}

/**
 * Rango horario no disponible
 */
export interface UnavailableTimeRange {
    /** Hora de inicio (formato "HH:MM") */
    from: string;
    /** Hora de fin (formato "HH:MM") */
    to: string;
}

/**
 * Configuración de disponibilidad para un día
 */
export interface BoatAvailability {
    /** Si el día está disponible */
    isAvailable: boolean;
    /** Ajuste de precio en porcentaje (-100 a 100) */
    priceAdjustment?: number;
    /** Rangos horarios no disponibles */
    unavailableTimeRanges?: UnavailableTimeRange[];
}

/**
 * Ajuste de precios para el calendario
 */
export interface CalendarPriceAdjustment {
    /** Porcentaje de ajuste (-100 a 100) */
    percentage: number;
    /** Precios por duración */
    durations?: {
        /** Precio para 2 horas */
        twoHour?: number;
        /** Precio para 3 horas */
        threeHour?: number;
        /** Precio para 4 horas (medio día) */
        halfDay?: number;
        /** Precio para 6 horas */
        sixHour?: number;
        /** Precio para 8 horas (día completo) */
        fullDay?: number;
    };
}

/**
 * Opciones para búsqueda de barcos
 */
export interface BoatSearchOptions {
    /** Ubicación (ciudad, puerto, etc.) */
    location?: string;
    /** Fecha de inicio (YYYY-MM-DD) */
    startDate?: string;
    /** Fecha de fin (YYYY-MM-DD) */
    endDate?: string;
    /** Cantidad de pasajeros */
    passengers?: number;
    /** Tipo de barco */
    boatType?: string;
    /** Filtro de precio mínimo */
    minPrice?: number;
    /** Filtro de precio máximo */
    maxPrice?: number;
    /** Solo barcos con capitán */
    withCaptain?: boolean;
    /** Solo barcos con Instant Book */
    instantBook?: boolean;
}

/**
 * Resultado de búsqueda de barcos
 */
export interface BoatSearchResult {
    /** Lista de barcos encontrados */
    boats: Boat[];
    /** Total de resultados */
    total: number;
    /** Página actual */
    page: number;
    /** Tamaño de página */
    pageSize: number;
}

/**
 * Estructura para representar una reserva
 */
export interface Booking {
    /** ID de la reserva */
    id: string;
    /** ID del barco */
    boatId: string;
    /** Nombre del barco */
    boatName: string;
    /** Fecha de inicio (YYYY-MM-DD) */
    startDate: string;
    /** Hora de inicio (HH:MM) */
    startTime: string;
    /** Fecha de fin (YYYY-MM-DD) */
    endDate: string;
    /** Hora de fin (HH:MM) */
    endTime: string;
    /** Estado de la reserva */
    status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
    /** Precio total */
    totalPrice: number;
    /** Información del arrendatario */
    renter?: {
        /** Nombre del arrendatario */
        name: string;
        /** Email del arrendatario */
        email: string;
        /** Teléfono del arrendatario */
        phone?: string;
    };
}