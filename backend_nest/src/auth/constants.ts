export const jwtConstants = {
  // En producción debe definirse la variable de entorno JWT_SECRET
  secret: process.env.JWT_SECRET || 'cambia-este-secreto-en-produccion',
  expiresIn: '1d',
} as const;
