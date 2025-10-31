/**
 * Sistema de tareas programadas (cron jobs) para alertas automatizadas
 * 
 * Este módulo inicializa todas las tareas programadas que ejecutan
 * automáticamente las funciones de generación y procesamiento de alertas.
 * 
 * Tareas programadas:
 * 1. Procesamiento de alertas pendientes: cada 15 minutos
 *    - Envía las alertas que ya están programadas para enviarse
 * 
 * 2. Generación de alertas de citas: cada hora
 *    - Busca citas confirmadas en las próximas 24 horas
 *    - Crea alertas de recordatorio automáticamente
 * 
 * 3. Generación de alertas de garantías: diario a las 8:00 AM
 *    - Busca garantías que vencen en los próximos 7 días
 *    - Crea alertas de vencimiento automáticamente
 * 
 * Nota: Los cron jobs se inicializan automáticamente al iniciar el servidor
 */

import cron from "node-cron";
import {
  generarAlertasCitas,
  generarAlertasGarantias,
  procesarAlertasPendientes,
} from "../services/alertas";

/**
 * Inicializa todos los cron jobs del sistema de alertas
 * Esta función debe ser llamada una vez al iniciar el servidor
 */
export function iniciarCronJobs() {
  console.log("Iniciando sistema de alertas automatizadas...");

  // Tarea 1: Procesar alertas pendientes cada 15 minutos
  // Formato cron: "*/15 * * * *" = cada 15 minutos
  cron.schedule("*/15 * * * *", async () => {
    console.log("[Cron] Procesando alertas pendientes...");
    try {
      const enviadas = await procesarAlertasPendientes();
      if (enviadas > 0) {
        console.log(`[Cron] ${enviadas} alertas enviadas`);
      }
    } catch (error: any) {
      console.error("[Cron] Error procesando alertas:", error.message);
    }
  });

  // Tarea 2: Generar alertas de citas cada hora
  // Formato cron: "0 * * * *" = en el minuto 0 de cada hora
  cron.schedule("0 * * * *", async () => {
    console.log("[Cron] Generando alertas de recordatorio de citas...");
    try {
      const creadas = await generarAlertasCitas();
      if (creadas > 0) {
        console.log(`[Cron] ${creadas} alertas de citas generadas`);
      }
    } catch (error: any) {
      console.error("[Cron] Error generando alertas de citas:", error.message);
    }
  });

  // Tarea 3: Generar alertas de garantías cada día a las 8:00 AM
  // Formato cron: "0 8 * * *" = a las 8:00 AM todos los días
  cron.schedule("0 8 * * *", async () => {
    console.log("[Cron] Generando alertas de vencimiento de garantías...");
    try {
      const creadas = await generarAlertasGarantias();
      if (creadas > 0) {
        console.log(`[Cron] ${creadas} alertas de garantías generadas`);
      }
    } catch (error: any) {
      console.error("[Cron] Error generando alertas de garantías:", error.message);
    }
  });

  console.log("Sistema de alertas automatizadas iniciado correctamente");
  console.log("   - Procesamiento de alertas: cada 15 minutos");
  console.log("   - Generación de alertas de citas: cada hora");
  console.log("   - Generación de alertas de garantías: diario a las 8:00 AM");
}
