import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "./api";

type Lead = { idCliente: number; nombre: string };
type Estado = "Programada" | "Confirmada" | "Cancelada" | "NoShow" | "Atendida";
type EstadoInput = "pendiente" | "confirmada" | "cancelada" | "no-show";
type Appointment = { idCita: number; fechaHora: string; estado: Estado; cliente?: Lead };

const ESTADOS_INPUT: readonly EstadoInput[] = ["pendiente", "confirmada", "cancelada", "no-show"] as const;

const ESTADO_LABELS: Record<Estado, string> = {
  Programada: "Pendiente",
  Confirmada: "Confirmada", 
  Cancelada: "Cancelada",
  NoShow: "No Asistió",
  Atendida: "Atendida"
};

const ESTADO_INPUT_LABELS: Record<EstadoInput, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cancelada: "Cancelada", 
  "no-show": "No Asistió"
};

// Convierte Date -> "YYYY-MM-DDTHH:mm" (hora LOCAL)
function toLocalInputValue(d: Date) {
  const two = (n: number) => n.toString().padStart(2, "0"); // <- tipado
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}T${two(d.getHours())}:${two(d.getMinutes())}`;
}

export default function Appointments() {
  const [searchParams] = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [leadId, setLeadId] = useState<number | "">("");
  const [fechaHora, setFechaHora] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [L, A] = await Promise.all([api.get<Lead[]>("/leads"), api.get<Appointment[]>("/appointments")]);
    setLeads(L.data);
    setAppts(A.data);
  };

  useEffect(() => {
    // setea fecha/hora por defecto al próximo bloque de 30'
    const now = new Date();
    const add = 30 - (now.getMinutes() % 30 || 30);
    now.setMinutes(now.getMinutes() + add, 0, 0);
    setFechaHora(toLocalInputValue(now));
    
    // Preseleccionar cliente si viene de URL
    const clienteId = searchParams.get('clienteId');
    if (clienteId) {
      setLeadId(Number(clienteId));
    }
    
    load();
  }, [searchParams]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !fechaHora) return;
    setBusy(true);
    try {
      // El navegador interpreta datetime-local como hora local; lo mandamos en ISO (UTC)
      const iso = new Date(fechaHora).toISOString();
      await api.post("/appointments", { leadId: Number(leadId), fechaHora: iso });
      setLeadId("");
      // deja la fecha al mismo valor elegido para crear varias seguidas
      await load();
    } finally {
      setBusy(false);
    }
  };

  const setEstado = async (idCita: number, estado: EstadoInput) => {
    setBusy(true);
    try {
      console.log(`Cambiando estado de cita ${idCita} a ${estado}`);
      const response = await api.patch(`/appointments/${idCita}/estado`, { estado });
      console.log('Respuesta del servidor:', response.data);
      await load();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert(`Error al cambiar estado: ${error}`);
    } finally {
      setBusy(false);
    }
  };

  const getEstadoBadgeStyle = (estado: Estado) => {
    switch (estado) {
      case "Confirmada":
        return { background: "#e8f9ee", color: "#065f46", border: "1px solid #a7f3d0" };
      case "Cancelada":
        return { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" };
      case "NoShow":
        return { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" };
      case "Atendida":
        return { background: "#e0e7ff", color: "#3730a3", border: "1px solid #c7d2fe" };
      default: // Programada
        return { background: "#dbeafe", color: "#1e40af", border: "1px solid #93c5fd" };
    }
  };

  return (
    <div className="grid">
      {/* Header */}
      <div className="section">
        <div className="section__header">
          <h1 className="section__title">📅 Gestión de Citas</h1>
          <p className="section__subtitle">
            Programa y administra las citas con los clientes captados
          </p>
        </div>
      </div>

      {/* Formulario de creación */}
      <div className="section">
        <div className="section__header">
          <h2 className="section__title">➕ Agendar Nueva Cita</h2>
          <p className="section__subtitle">
            Selecciona el cliente captado y la fecha/hora para la cita
          </p>
        </div>

        {/* Mensaje cuando viene preseleccionado desde consulta de clientes */}
        {searchParams.get('clienteNombre') && (
          <div className="alert alert--info" style={{ marginBottom: "1rem" }}>
            <strong>👤 Cliente preseleccionado:</strong> {searchParams.get('clienteNombre')}
            <br />
            <small>Selecciona la fecha y hora para agendar la cita.</small>
          </div>
        )}

        <form onSubmit={create} className="form">
          <div className="form__row">
            <div className="form__group">
              <label className="form__label">Cliente Captado *</label>
              <select
                className="form__input"
                value={leadId}
                onChange={(e) => setLeadId(e.target.value ? Number(e.target.value) : "")}
                required
              >
                <option value="">Seleccione un cliente...</option>
                {leads.map((l) => (
                  <option key={l.idCliente} value={l.idCliente}>
                    #{l.idCliente} — {l.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form__group">
              <label className="form__label">Fecha y Hora *</label>
              <input
                type="datetime-local"
                className="form__input"
                value={fechaHora}
                onChange={(e) => setFechaHora(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={busy || !leadId || !fechaHora} 
            className="btn btn--primary"
          >
            {busy ? (
              <>
                <div className="loading__spinner" style={{ margin: 0, width: "1rem", height: "1rem" }}></div>
                Guardando...
              </>
            ) : (
              "📅 Agendar Cita"
            )}
          </button>
        </form>
      </div>

      {/* Lista de citas */}
      <div className="section">
        <div className="section__header">
          <h2 className="section__title">📋 Citas Programadas</h2>
          <p className="section__subtitle">
            {appts.length} citas en el sistema
          </p>
        </div>

        {appts.length === 0 ? (
          <div className="alert alert--info">
            ℹ️ No hay citas programadas aún. Crea la primera cita usando el formulario arriba.
          </div>
        ) : (
          <div className="table-container" style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Fecha y Hora</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
                     <tbody>
                       {appts.map((a) => (
                         <tr key={a.idCita}>
                           <td>
                             <code style={{ 
                               background: "var(--gris)", 
                               padding: "0.25rem 0.5rem", 
                               borderRadius: "0.25rem",
                               fontSize: "0.9rem"
                             }}>
                               #{a.idCita}
                             </code>
                           </td>
                           <td style={{ fontWeight: "600" }}>
                             {a.cliente ? (
                               <>
                                 <span style={{ color: "var(--texto-sec)", fontSize: "0.85rem" }}>
                                   #{a.cliente.idCliente}
                                 </span>
                                 {" "}
                                 {a.cliente.nombre}
                               </>
                             ) : (
                               <span style={{ color: "var(--texto-sec)" }}>Cliente no disponible</span>
                             )}
                           </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <span style={{ fontWeight: "600" }}>
                          📅 {new Date(a.fechaHora).toLocaleDateString('es-CL', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span style={{ color: "var(--texto-sec)", fontSize: "0.9rem" }}>
                          🕐 {new Date(a.fechaHora).toLocaleTimeString('es-CL', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          ...getEstadoBadgeStyle(a.estado),
                          padding: "0.4rem 0.8rem",
                          borderRadius: "0.5rem",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          display: "inline-block"
                        }}
                      >
                        {ESTADO_LABELS[a.estado]}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {ESTADOS_INPUT.map((s) => {
                          // Convertir estado de entrada a estado de visualización para comparar
                          const estadoDisplay = s === "pendiente" ? "Programada" : 
                                              s === "confirmada" ? "Confirmada" :
                                              s === "cancelada" ? "Cancelada" : "NoShow";
                          
                          return (
                            <button
                              key={s}
                              type="button"
                              disabled={busy || a.estado === estadoDisplay}
                              onClick={() => setEstado(a.idCita, s)}
                              className="btn btn--secondary btn--small"
                              title={`Marcar como ${ESTADO_INPUT_LABELS[s]}`}
                              style={{
                                opacity: a.estado === estadoDisplay ? 0.5 : 1,
                                cursor: a.estado === estadoDisplay ? "not-allowed" : "pointer"
                              }}
                            >
                              {s === "confirmada" ? "✅" : s === "cancelada" ? "❌" : s === "no-show" ? "⚠️" : "⏳"}
                              {" "}
                              {ESTADO_INPUT_LABELS[s]}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
