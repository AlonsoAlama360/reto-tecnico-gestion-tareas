import { Platform } from 'react-native';

const API_PORT = 5080;

/**
 * URL base de la API en desarrollo.
 *
 * El emulador de Android es una máquina aparte: su "localhost" es el propio
 * emulador, y 10.0.2.2 es el alias que apunta al equipo anfitrión. El
 * simulador de iOS comparte red con el equipo y sí puede usar localhost.
 *
 * Para un dispositivo físico, sustituye el host por la IP del equipo en la
 * red local y arranca la API escuchando en esa interfaz.
 */
export const API_BASE_URL = Platform.select({
  android: `http://10.0.2.2:${API_PORT}`,
  default: `http://localhost:${API_PORT}`,
});

export const API_TIMEOUT_MS = 10_000;
