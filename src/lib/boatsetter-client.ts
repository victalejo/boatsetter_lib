import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { BoatsetterClientOptions, BoatsetterCredentials, LoginResult, Boat, BoatAvailability } from './interfaces';
import { createLogger, LogLevel } from '../utils/logger';

/**
 * Cliente principal para interactuar con Boatsetter
 */
export class BoatsetterClient {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private baseUrl: string;
    private timeout: number;
    private isLoggedIn: boolean = false;
    private logger: any;

    /**
     * Constructor para la clase BoatsetterClient
     * @param options Opciones de configuración
     */
    constructor(
        private options: BoatsetterClientOptions = {}
    ) {
        this.baseUrl = options.baseUrl || 'https://www.boatsetter.com';
        this.timeout = options.timeout || 30000;
        this.logger = createLogger('BoatsetterClient',
            options.verbose ? LogLevel.DEBUG : LogLevel.INFO);
    }

    /**
     * Inicializa el navegador y crea una nueva página
     */
    async initialize(): Promise<void> {
        this.logger.info('Inicializando navegador...');

        this.browser = await chromium.launch({
            headless: this.options.headless !== false
        });
        this.context = await this.browser.newContext();
        this.page = await this.context.newPage();

        this.logger.info(`Navegando a ${this.baseUrl}`);
        await this.page.goto(this.baseUrl);

        this.logger.info('Navegador inicializado correctamente');
    }

    /**
     * Realiza el login en Boatsetter
     * @param credentials Credenciales de usuario
     * @returns Promise<LoginResult> Resultado de la operación de login
     */
    async login(credentials: BoatsetterCredentials): Promise<LoginResult> {
        if (!this.page) {
            throw new Error('El cliente no está inicializado. Llama a initialize() primero.');
        }

        const { email, password } = credentials;

        this.logger.info(`Intentando iniciar sesión con: ${email}`);

        try {
            // Hacer clic en el botón de login
            this.logger.debug('Abriendo el modal de login...');
            await this.page.locator('span').filter({ hasText: 'Log in' }).click();

            // Completar el formulario de login
            this.logger.debug('Completando formulario...');
            await this.page.locator('input[name="email"]').click();
            await this.page.locator('input[name="email"]').fill(email);
            await this.page.locator('input[name="password"]').click();
            await this.page.locator('input[name="password"]').fill(password);

            // Enviar el formulario
            this.logger.debug('Enviando formulario...');
            await this.page.getByRole('button', { name: 'LOG IN' }).click();

            // Esperar a que el login se complete
            await this.page.waitForNavigation({
                waitUntil: 'networkidle',
                timeout: this.timeout
            }).catch(() => {
                // Si el timeout ocurre, seguimos adelante. Puede que no haya una redirección.
                this.logger.debug('No se detectó navegación después del login.');
            });

            // Verificar si el login fue exitoso
            this.logger.debug('Verificando resultado del login...');
            const isLoggedIn = await this.checkIfLoggedIn();
            this.isLoggedIn = isLoggedIn;

            if (isLoggedIn) {
                this.logger.info('Login exitoso!');
                return {
                    success: true,
                    message: 'Inicio de sesión exitoso'
                };
            } else {
                this.logger.warn('Login fallido.');
                return {
                    success: false,
                    message: 'Credenciales inválidas o error durante el login'
                };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            this.logger.error('Error durante el login:', errorMessage);

            return {
                success: false,
                message: `Error durante el login: ${errorMessage}`
            };
        }
    }

    /**
     * Verifica si el usuario está logueado
     * @returns Promise<boolean> true si el usuario está logueado, false en caso contrario
     */
    private async checkIfLoggedIn(): Promise<boolean> {
        if (!this.page) {
            return false;
        }

        try {
            // Verificar si existe algún elemento que solo aparece cuando el usuario está logueado
            const logoutButton = await this.page.locator('span').filter({ hasText: 'Log out' }).count();
            const userMenu = await this.page.locator('div[data-testid="user-menu"]').count();
            const userButton = await this.page.getByRole('button', { name: /Adalberto|Usuario/ }).count();

            return logoutButton > 0 || userMenu > 0 || userButton > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Navega al dashboard del propietario
     * @returns Promise<boolean> Éxito de la navegación
     */
    async navigateToOwnerDashboard(): Promise<boolean> {
        if (!this.page) {
            throw new Error('El cliente no está inicializado. Llama a initialize() primero.');
        }

        if (!this.isLoggedIn) {
            this.logger.warn('Debes iniciar sesión primero');
            return false;
        }

        try {
            this.logger.info('Navegando al panel del propietario...');

            // Abrir menú de usuario
            try {
                await this.page.getByRole('button', { name: /Adalberto|Usuario/ }).click();
                await this.page.getByRole('link', { name: 'My boats' }).click();
            } catch (error) {
                // Intentar una ruta alternativa
                await this.page.goto(`${this.baseUrl}/owner/boats`);
            }

            // Verificar que estamos en la página correcta
            await this.page.waitForSelector('.boatsList', { timeout: this.timeout });

            this.logger.info('Navegación al dashboard exitosa');
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            this.logger.error('Error al navegar al dashboard:', errorMessage);
            return false;
        }
    }

    /**
     * Obtiene la lista de barcos del propietario
     * @returns Promise<Boat[]> Lista de barcos
     */
    async getBoatsList(): Promise<Boat[]> {
        if (!this.page) {
            throw new Error('El cliente no está inicializado. Llama a initialize() primero.');
        }

        try {
            // Asegurarse de estar en la página de barcos
            const currentUrl = this.page.url();
            if (!currentUrl.includes('/owner/boats')) {
                await this.navigateToOwnerDashboard();
            }

            this.logger.info('Obteniendo lista de barcos...');

            // Esperar a que los barcos se carguen
            await this.page.waitForSelector('.boat', { timeout: this.timeout });

            // Extraer información de todos los barcos
            const boats = await this.page.evaluate(() => {
                const boatElements = document.querySelectorAll('.boat');

                return Array.from(boatElements).map(boat => {
                    // Extraer información básica
                    const titleElement = boat.querySelector('.title a');
                    const title = titleElement ? titleElement.textContent?.trim() || '' : '';
                    const url = titleElement ? titleElement.getAttribute('href') || '' : '';
                    const id = url.split('/boats/')[1] || '';

                    const statusElement = boat.querySelector('.approved');
                    const status = statusElement ? statusElement.textContent?.trim() || '' : '';

                    const imageElement = boat.querySelector('.imageContainer img');
                    const imageUrl = imageElement ? imageElement.getAttribute('src') || '' : '';

                    const viewsElement = boat.querySelector('.viewsContainer span');
                    const viewsText = viewsElement ? viewsElement.textContent?.trim().split('views')[0].trim() || '0' : '0';
                    const views = parseInt(viewsText.replace(',', ''), 10);

                    // Verificar si tiene instant book activado
                    const instantBookElement = boat.querySelector('.instantBook span b');
                    const instantBookText = instantBookElement ? instantBookElement.textContent?.trim() || '' : '';
                    const isInstantBookEnabled = instantBookText === 'ON';

                    // Verificar si es administrado
                    const isManaged = !!boat.querySelector('.managed');

                    return {
                        id,
                        title,
                        url,
                        status,
                        imageUrl,
                        views,
                        isInstantBookEnabled,
                        isManaged
                    };
                });
            });

            this.logger.info(`Se encontraron ${boats.length} barcos`);
            return boats;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            this.logger.error('Error al obtener la lista de barcos:', errorMessage);
            return [];
        }
    }

    /**
     * Edita un barco específico
     * @param boatId ID del barco a editar
     * @returns Promise<boolean> Éxito de la operación
     */
    async editBoat(boatId: string): Promise<boolean> {
        if (!this.page) {
            throw new Error('El cliente no está inicializado. Llama a initialize() primero.');
        }

        try {
            // Obtener la lista actual de barcos
            const currentUrl = this.page.url();
            if (!currentUrl.includes('/owner/boats')) {
                await this.navigateToOwnerDashboard();
            }

            this.logger.info(`Editando barco con ID: ${boatId}`);

            // Buscar el barco en la lista
            const boatSelector = `.boat:has(.title a[href="/boats/${boatId}"])`;

            try {
                await this.page.waitForSelector(boatSelector, { timeout: 5000 });
                // Hacer clic en el botón de editar para ese barco específico
                await this.page.locator(`${boatSelector} button:has-text("edit listing")`).click();
            } catch (e) {
                // Intentar una ruta alternativa directa
                this.logger.debug('No se encontró el barco en la lista, intentando acceso directo...');
                await this.page.goto(`${this.baseUrl}/boats/${boatId}/edit/overview`);
            }

            // Esperar a que la página de edición se cargue
            await this.page.waitForNavigation({
                waitUntil: 'networkidle',
                timeout: this.timeout
            }).catch(() => {
                this.logger.debug('No se detectó navegación después de hacer clic en editar.');
            });

            // Verificar que estamos en la página de edición
            const editUrl = this.page.url();
            if (editUrl.includes(`/boats/${boatId}/edit`) || editUrl.includes(`/boats/${boatId}/manage`)) {
                this.logger.info('Navegación a página de edición exitosa');
                return true;
            } else {
                this.logger.warn('No se pudo navegar a la página de edición');
                return false;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            this.logger.error(`Error al editar barco ${boatId}:`, errorMessage);
            return false;
        }
    }

    /**
     * Navega al calendario del barco
     * @param boatId ID del barco
     * @returns Promise<boolean> Éxito de la operación
     */
    async navigateToBoatCalendar(boatId: string): Promise<boolean> {
        if (!this.page) {
            throw new Error('El cliente no está inicializado. Llama a initialize() primero.');
        }

        try {
            // Asegurarse de estar en la página de edición del barco
            const currentUrl = this.page.url();
            if (!currentUrl.includes(`/boats/${boatId}`)) {
                const editSuccess = await this.editBoat(boatId);
                if (!editSuccess) {
                    return false;
                }
            }

            this.logger.info(`Navegando al calendario del barco ${boatId}...`);

            // Ir directamente a la URL del calendario
            await this.page.goto(`${this.baseUrl}/boats/${boatId}/edit/calendar`);

            // Esperar a que el calendario se cargue
            await this.page.waitForSelector('#js-calendar-editor', { timeout: this.timeout });

            this.logger.info('Navegación al calendario exitosa');
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            this.logger.error(`Error al navegar al calendario del barco ${boatId}:`, errorMessage);
            return false;
        }
    }

    /**
     * Navega al mes específico en el calendario
     * @param date Fecha objetivo (puede ser string en formato YYYY-MM-DD o Date)
     * @returns Promise<boolean> Éxito de la navegación
     */
    async navigateToMonth(date: string | Date): Promise<boolean> {
        if (!this.page) {
            throw new Error('El cliente no está inicializado. Llama a initialize() primero.');
        }

        try {
            // Convertir a objeto Date si es un string
            const targetDate = typeof date === 'string' ? new Date(date) : date;

            // Obtener nombres de meses en inglés
            const meses = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];

            // Obtener el mes y año objetivo
            const targetMonth = meses[targetDate.getMonth()];
            const targetYear = targetDate.getFullYear();
            const targetMonthYear = `${targetMonth} ${targetYear}`;

            this.logger.debug(`Navegando al mes de calendario: ${targetMonthYear}`);

            // Verificar el mes actual que se muestra
            const currentMonthYearElement = this.page.locator('.Calendar-month-year');
            const currentMonthYear = await currentMonthYearElement.textContent();

            if (currentMonthYear === targetMonthYear) {
                this.logger.debug(`Ya estamos en el mes correcto: ${targetMonthYear}`);
                return true;
            }

            // Extraer el mes y año actuales
            const [currentMonth, currentYearStr] = (currentMonthYear || '').split(' ');
            const currentYear = parseInt(currentYearStr || '0', 10);

            // Determinar si necesitamos avanzar o retroceder
            const currentMonthIndex = meses.indexOf(currentMonth || '');
            const targetMonthIndex = targetDate.getMonth();

            // Calcular la diferencia en meses
            const yearDiff = targetYear - currentYear;
            const monthDiff = targetMonthIndex - currentMonthIndex + (yearDiff * 12);

            if (monthDiff > 0) {
                // Avanzar meses
                for (let i = 0; i < monthDiff; i++) {
                    await this.page.getByRole('button').nth(2).click(); // Botón "siguiente mes"
                    await this.page.waitForTimeout(300);
                }
            } else if (monthDiff < 0) {
                // Retroceder meses
                for (let i = 0; i < Math.abs(monthDiff); i++) {
                    await this.page.getByRole('button').nth(1).click(); // Botón "mes anterior"
                    await this.page.waitForTimeout(300);
                }
            }

            // Verificar que hemos llegado al mes deseado
            const newMonthYear = await currentMonthYearElement.textContent();
            if (newMonthYear?.includes(targetMonth)) {
                this.logger.debug(`Navegación exitosa al mes: ${targetMonth}`);
                return true;
            } else {
                this.logger.warn(`No se pudo navegar al mes deseado. Estamos en: ${newMonthYear}`);
                return false;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            this.logger.error(`Error al navegar al mes en el calendario: ${errorMessage}`);
            return false;
        }
    }

    /**
     * Establece la disponibilidad para una fecha específica
     * @param boatId ID del barco
     * @param date Fecha en formato YYYY-MM-DD
     * @param availability Configuración de disponibilidad
     * @returns Promise<boolean> Éxito de la operación
     */
    async setDateAvailability(
        boatId: string,
        date: string,
        availability: BoatAvailability
    ): Promise<boolean> {
        if (!this.page) {
            throw new Error('El cliente no está inicializado. Llama a initialize() primero.');
        }

        try {
            // Navegar al calendario
            const calendarSuccess = await this.navigateToBoatCalendar(boatId);
            if (!calendarSuccess) {
                return false;
            }

            this.logger.info(`Configurando disponibilidad para el día ${date}...`);

            // Primero navegar al mes correcto
            const dateObj = new Date(date);
            const monthNavigationSuccess = await this.navigateToMonth(dateObj);
            if (!monthNavigationSuccess) {
                this.logger.error(`No se pudo navegar al mes correspondiente para la fecha ${date}`);
                return false;
            }

            // Obtener solo el día de la fecha
            const day = dateObj.getDate().toString();

            // Hacer doble clic en la celda del día
            await this.page.getByRole('cell', { name: day }).dblclick();

            // Esperar a que el formulario de edición aparezca
            await this.page.waitForSelector('#js-calendar-editor-title', {
                timeout: this.timeout,
                state: 'visible'
            });

            // Configurar la disponibilidad (encendido/apagado)
            const isCurrentlyAvailable = await this.page.locator('#js-calendar-editor-status').isChecked();

            if (availability.isAvailable !== isCurrentlyAvailable) {
                // Clic en el label del switch en lugar del input
                await this.page.locator('#pricing-switch span').first().click();
            }

            // Si hay configuración de horas no disponibles y el día está disponible
            if (availability.unavailableTimeRanges &&
                availability.unavailableTimeRanges.length > 0 &&
                availability.isAvailable) {

                // Marcar la casilla para habilitar rangos horarios
                await this.page.getByText('Mark specific time range(s)').click();

                // Para cada rango horario
                for (let i = 0; i < availability.unavailableTimeRanges.length; i++) {
                    const range = availability.unavailableTimeRanges[i];

                    // Si no es el primer rango, añadir un nuevo rango
                    if (i > 0) {
                        await this.page.getByRole('button', { name: 'Add new range' }).click();
                        // Esperar a que se agregue el nuevo selector
                        await this.page.waitForTimeout(300);
                    }

                    // Establecer los valores de tiempo desde/hasta
                    await this.page.locator('select[name="hourly_unavailability_from\\[\\]"]').nth(i).selectOption(range.from);
                    await this.page.locator('select[name="hourly_unavailability_to\\[\\]"]').nth(i).selectOption(range.to);
                }
            }

            // Si hay ajustes de precio, configurarlos
            if (availability.priceAdjustment !== undefined && availability.isAvailable) {
                // Ajustar el deslizador de precio
                const slider = this.page.locator('#js-percentage-field');
                await slider.fill(availability.priceAdjustment.toString());
            }

            // Guardar cambios
            await this.page.getByRole('button', { name: 'Save Changes' }).click();

            // Esperar a que se complete la operación
            await this.page.waitForNavigation({ timeout: this.timeout })
                .catch(() => this.logger.debug('No se detectó navegación después de guardar cambios.'));

            this.logger.info(`Disponibilidad para el día ${date} configurada exitosamente`);
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            this.logger.error(`Error al configurar disponibilidad para ${date}: ${errorMessage}`);
            return false;
        }
    }

    /**
     * Configura la disponibilidad para un rango de fechas
     * @param boatId ID del barco
     * @param startDate Fecha de inicio en formato YYYY-MM-DD
     * @param endDate Fecha de fin en formato YYYY-MM-DD
     * @param availability Configuración de disponibilidad
     * @returns Promise<boolean> Éxito de la operación
     */
    async setDateRangeAvailability(
        boatId: string,
        startDate: string,
        endDate: string,
        availability: BoatAvailability
    ): Promise<boolean> {
        // Para implementar esta función iteramos día por día
        const start = new Date(startDate);
        const end = new Date(endDate);
        let success = true;

        for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
            const dateStr = day.toISOString().split('T')[0];
            const result = await this.setDateAvailability(boatId, dateStr, availability);
            if (!result) {
                success = false;
            }
        }

        return success;
    }

    /**
     * Activa o desactiva un barco
     * @param boatId ID del barco
     * @param activate true para activar, false para desactivar
     * @returns Promise<boolean> Éxito de la operación
     */
    async toggleBoatStatus(boatId: string, activate: boolean): Promise<boolean> {
        if (!this.page) {
            throw new Error('El cliente no está inicializado. Llama a initialize() primero.');
        }

        try {
            // Navegar a la edición del barco
            const editSuccess = await this.editBoat(boatId);
            if (!editSuccess) {
                return false;
            }

            this.logger.info(`${activate ? 'Activando' : 'Desactivando'} barco ${boatId}...`);

            // Buscar el toggle de estado y verificar su estado actual
            const statusToggle = this.page.locator('.status-toggle');
            const isCurrentlyActive = await statusToggle.textContent()
                .then(text => text?.includes('Active') || false);

            // Solo cambiar si es necesario
            if ((activate && !isCurrentlyActive) || (!activate && isCurrentlyActive)) {
                // Hacer clic en el toggle de estado
                await statusToggle.click();

                // Confirmar cambio si hay diálogo
                const hasConfirmDialog = await this.page.locator('.modal-confirm').isVisible();
                if (hasConfirmDialog) {
                    await this.page.locator('.modal-confirm button:has-text("Confirm")').click();
                }

                // Esperar a que se complete la acción
                await this.page.waitForResponse(
                    resp => resp.url().includes('/api/boats/') && resp.status() === 200,
                    { timeout: this.timeout }
                );
            }

            this.logger.info(`Barco ${activate ? 'activado' : 'desactivado'} correctamente`);
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            this.logger.error(`Error al cambiar estado del barco ${boatId}:`, errorMessage);
            return false;
        }
    }

    /**
     * Cierra el navegador y termina la sesión
     */
    async close(): Promise<void> {
        this.logger.info('Cerrando sesión y navegador...');

        if (this.context) {
            await this.context.close();
        }
        if (this.browser) {
            await this.browser.close();
        }

        this.context = null;
        this.browser = null;
        this.page = null;
        this.isLoggedIn = false;

        this.logger.info('Navegador cerrado correctamente');
    }
}