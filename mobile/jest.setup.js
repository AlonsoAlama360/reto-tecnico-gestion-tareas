/* eslint-env jest */

// Las pantallas leen los márgenes seguros del dispositivo; en los tests no hay
// módulo nativo que los aporte, así que se usa el doble que publica la librería.
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
