module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  clearMocks: true,
  // La primera ejecución compila React Native sin caché y, en un equipo
  // cargado, el primer test de cada archivo supera los 5 s por defecto.
  testTimeout: 30000,
};
