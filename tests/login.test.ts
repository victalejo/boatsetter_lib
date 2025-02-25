import { BoatsetterClient } from '../src/lib';
import * as dotenv from 'dotenv';
import {afterEach, beforeEach, describe} from "node:test";
import test from "node:test";
import {expect} from "playwright/test";

// Cargar variables de entorno para las pruebas
dotenv.config();

function beforeAll(param: () => void) {
    
}

describe('BoatsetterClient - Login', () => {
    let client: BoatsetterClient;

    beforeAll(() => {
        // Crear una instancia del cliente para todas las pruebas
        client = new BoatsetterClient({
            headless: true, // Ejecutar en modo headless para CI
            timeout: 60000, // Timeout más largo para pruebas
            verbose: false
        });
    });

    beforeEach(async () => {
        // Inicializar el cliente antes de cada prueba
        await client.initialize();
    });

    afterEach(async () => {
        // Cerrar el cliente después de cada prueba
        await client.close();
    });

    test('debería inicializar correctamente', async () => {
        // Esta prueba se maneja con beforeEach y afterEach
        expect(client).toBeDefined();
    });

    test('debería fallar con credenciales inválidas', async () => {
        const result = await client.login({
            email: 'usuario-invalido@ejemplo.com',
            password: 'contraseña-invalida'
        });

        expect(result.success).toBe(false);
        expect(result.message).toContain('Credenciales inválidas');
    });

    test('debería iniciar sesión correctamente con credenciales válidas', async () => {
        // Solo ejecutar si hay credenciales en .env
        const email = process.env.BOATSETTER_EMAIL;
        const password = process.env.BOATSETTER_PASSWORD;

        if (!email || !password) {
            console.warn('Credenciales no encontradas. Omitiendo prueba de login exitoso.');
            return;
        }

        const result = await client.login({ email, password });
        expect(result.success).toBe(true);
        expect(result.message).toContain('exitoso');
    });
});