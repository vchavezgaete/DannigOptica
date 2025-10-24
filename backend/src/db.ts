import { PrismaClient } from '@prisma/client';
import { resolveDatabaseUrl, maskDatabaseUrl } from './utils/database';

// Resolver DATABASE_URL correctamente
let databaseUrl: string;
try {
  databaseUrl = resolveDatabaseUrl();
  
  // En desarrollo, mostrar URL enmascarada para debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔗 DATABASE_URL:', maskDatabaseUrl(databaseUrl));
  }
} catch (error) {
  console.error('❌ Error resolviendo DATABASE_URL:', error.message);
  process.exit(1);
}

// Configurar Prisma con la URL resuelta
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  },
  log: ['warn', 'error'],
});

console.log('✅ Prisma Client configurado correctamente');
