import { PrismaClient } from '@prisma/client';
import { resolveDatabaseUrl, maskDatabaseUrl } from './utils/database';

// Resolver DATABASE_URL correctamente
try {
  const databaseUrl = resolveDatabaseUrl();
  
  // En desarrollo, mostrar URL enmascarada para debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔗 DATABASE_URL:', maskDatabaseUrl(databaseUrl));
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
} catch (error) {
  console.error('❌ Error configurando Prisma Client:', error.message);
  process.exit(1);
}
