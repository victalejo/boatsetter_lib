import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { BoatsetterClientOptions, BoatsetterCredentials, LoginResult } from './interfaces';

/**
 * Clase principal para interactuar con Boatsetter
 */
export class BoatsetterClient {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private baseUrl: string;
    private timeout: number;
    private verbose: boolean;
    private isLoggedIn: boolean = false;

    /**
     * Constructor para la clase BoatsetterClient
     * @param options Opciones de configuración
     */
    constructor(
        private options: BoatsetterClientOptions = {}
    ) {
        this.baseUrl = options.baseUrl || 'https://www.boatsetter.com';
        this.timeout = options.timeout || 30000;
        this.verbose = options.verbose || false;
    }

    /**
     * Inicializa el navegador y crea una nueva página
     */
    async initialize(): Promise<void> {
        if (this.verbose) console.log('Inicializando navegador...');

        this.browser = await chromium.launch({
            headless: this.options.headless !== false
        });
        this.context = await this.browser.newContext();
        this.page = await this.context.newPage();

        if (this.verbose) console.log(`Navegando a ${this.baseUrl}`);
        await this.page.goto(this.baseUrl);

        if (this.verbose) console.log('Navegador inicializado correctamente');
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

        if (this.verbose) console.log(`Intentando iniciar sesión con: ${email}`);

        try {
            // Hacer clic en el botón de login
            if (this.verbose) console.log('Abriendo el modal de login...');
            await this.page.locator('span').filter({ hasText: 'Log in' }).click();

            // Completar el formulario de login
            if (this.verbose) console.log('Completando formulario...');
            await this.page.locator('input[name="email"]').click();
            await this.page.locator('input[name="email"]').fill(email);
            await this.page.locator('input[name="password"]').click();
            await this.page.locator('input[name="password"]').fill(password);

            // Enviar el formulario
            if (this.verbose) console.log('Enviando formulario...');
            await this.page.getByRole('button', { name: 'LOG IN' }).click();

            // Esperar a que el login se complete
            await this.page.waitForNavigation({
                waitUntil: 'networkidle',
                timeout: this.timeout
            }).catch(() => {
                // Si el timeout ocurre, seguimos adelante. Puede que no haya una redirección.
                if (this.verbose) console.log('No se detectó navegación después del login.');
            });

            // Verificar si el login fue exitoso
            if (this.verbose) console.log('Verificando resultado del login...');
            const isLoggedIn = await this.checkIfLoggedIn();
            this.isLoggedIn = isLoggedIn;

            if (isLoggedIn) {
                if (this.verbose) console.log('Login exitoso!');
                return {
                    success: true,
                    message: 'Inicio de sesión exitoso'
                };
            } else {
                if (this.verbose) console.log('Login fallido.');
                return {
                    success: false,
                    message: 'Credenciales inválidas o error durante el login'
                };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            if (this.verbose) console.error('Error durante el login:', errorMessage);

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
            // Esto puede variar según la estructura de la página, ajusta según corresponda
            const logoutButton = await this.page.locator('span').filter({ hasText: 'Log out' }).count();
            const userMenu = await this.page.locator('div[data-testid="user-menu"]').count();

            return logoutButton > 0 || userMenu > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Cierra el navegador y termina la sesión
     */
    async close(): Promise<void> {
        if (this.verbose) console.log('Cerrando sesión y navegador...');

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

        if (this.verbose) console.log('Navegador cerrado correctamente');
    }
}