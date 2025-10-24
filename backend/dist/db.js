"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("./utils/database");
// Resolver DATABASE_URL correctamente
let databaseUrl;
try {
    databaseUrl = (0, database_1.resolveDatabaseUrl)();
    // En desarrollo, mostrar URL enmascarada para debugging
    if (process.env.NODE_ENV !== 'production') {
        console.log('🔗 DATABASE_URL:', (0, database_1.maskDatabaseUrl)(databaseUrl));
    }
}
catch (error) {
    console.error('❌ Error resolviendo DATABASE_URL:', error instanceof Error ? error.message : String(error));
    process.exit(1);
}
// Configurar Prisma con la URL resuelta
exports.prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: databaseUrl
        }
    },
    log: ['warn', 'error'],
});
console.log('✅ Prisma Client configurado correctamente');
