import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

type Cliente = {
  idCliente: number;
  rut: string;
  nombre: string;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  sector?: string | null;
  fechaCreacion: string;
};

export default function Clientes() {
  const navigate = useNavigate();
  const [rut, setRut] = useState("");
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [historialData, setHistorialData] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    direccion: "",
    sector: ""
  });

  async function buscar() {
    setErr(null); setCliente(null); setLoading(true);
    try {
      const { data } = await api.get<Cliente | null>("/clientes", { params: { rut } });
      setCliente(data ?? null);
      if (!data) setErr("No encontrado");
    } catch {
        setErr("falló");
      setErr("Error consultando cliente");
    } finally {
      setLoading(false);
    }
  }

  async function cargarHistorial() {
    if (!cliente) return;
    
    setLoading(true);
    try {
      const { data } = await api.get(`/clientes/${cliente.idCliente}/historial`);
      setHistorialData(data);
      setShowHistorialModal(true);
    } catch (error) {
      setErr("Error cargando historial");
    } finally {
      setLoading(false);
    }
  }

  function abrirEditarModal() {
    if (cliente) {
      setEditForm({
        nombre: cliente.nombre || "",
        telefono: cliente.telefono || "",
        correo: cliente.correo || "",
        direccion: cliente.direccion || "",
        sector: cliente.sector || ""
      });
      setShowEditModal(true);
    }
  }

  async function guardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    if (!cliente) return;

    setLoading(true);
    try {
      await api.put(`/clientes/${cliente.idCliente}`, editForm);
      // Recargar datos del cliente
      await buscar();
      setShowEditModal(false);
      setErr(null);
    } catch (error) {
      setErr("Error al actualizar cliente");
    } finally {
      setLoading(false);
    }
  }

  function getEstadoLabel(estado: string) {
    switch (estado) {
      case "Programada": return "Pendiente";
      case "Confirmada": return "Confirmada";
      case "Cancelada": return "Cancelada";
      case "NoShow": return "No Asistió";
      case "Atendida": return "Atendida";
      default: return estado;
    }
  }

  function getEstadoStyle(estado: string) {
    switch (estado) {
      case "Confirmada":
        return { background: "#e8f9ee", color: "#065f46" };
      case "Cancelada":
        return { background: "#fee2e2", color: "#991b1b" };
      case "NoShow":
        return { background: "#fef3c7", color: "#92400e" };
      case "Atendida":
        return { background: "#e0e7ff", color: "#3730a3" };
      default: // Programada
        return { background: "#dbeafe", color: "#1e40af" };
    }
  }

  return (
    <div className="grid">
      {/* Header */}
      <div className="section">
        <div className="section__header">
          <h1 className="section__title">👥 Consulta de Clientes</h1>
          <p className="section__subtitle">
            Busca información detallada de tus clientes registrados
          </p>
        </div>
      </div>

      {/* Formulario de búsqueda */}
      <div className="section">
        <div className="section__header">
          <h2 className="section__title">🔍 Buscar Cliente</h2>
          <p className="section__subtitle">Ingresa el RUT del cliente que deseas consultar</p>
        </div>

        <div className="flex">
          <input 
            className="form__input"
            value={rut} 
            onChange={(e) => setRut(e.currentTarget.value)} 
            placeholder="Ingresa el RUT del cliente (ej: 12.345.678-9)" 
            style={{ flex: 1 }}
          />
          <button 
            onClick={buscar} 
            disabled={loading} 
            className="btn btn--primary"
          >
            {loading ? (
              <>
                <div className="loading__spinner" style={{ margin: 0, width: "1rem", height: "1rem" }}></div>
                Buscando...
              </>
            ) : (
              "🔍 Buscar Cliente"
            )}
          </button>
        </div>

        {err && <div className="alert alert--error">❌ {err}</div>}
      </div>

      {/* Resultado de la búsqueda */}
      {cliente && (
        <div className="section">
          <div className="section__header">
            <h2 className="section__title">👤 Información del Cliente</h2>
            <p className="section__subtitle">Datos completos del cliente encontrado</p>
          </div>

          <div className="grid grid--2">
            {/* Información personal */}
            <div className="card">
              <h3 style={{ margin: "0 0 1rem", color: "var(--verde)" }}>📋 Datos Personales</h3>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <div className="flex">
                  <span style={{ fontWeight: "600", minWidth: "80px" }}>RUT:</span>
                  <code style={{ 
                    background: "var(--gris)", 
                    padding: "0.25rem 0.5rem", 
                    borderRadius: "0.25rem",
                    fontSize: "0.9rem"
                  }}>
                    {cliente.rut}
                  </code>
                </div>
                <div className="flex">
                  <span style={{ fontWeight: "600", minWidth: "80px" }}>Nombre:</span>
                  <span style={{ fontWeight: "600" }}>{cliente.nombre}</span>
                </div>
                <div className="flex">
                  <span style={{ fontWeight: "600", minWidth: "80px" }}>Sector:</span>
                  <span>{cliente.sector || <span style={{ color: "var(--texto-sec)" }}>No especificado</span>}</span>
                </div>
                <div className="flex">
                  <span style={{ fontWeight: "600", minWidth: "80px" }}>Registro:</span>
                  <span style={{ color: "var(--texto-sec)", fontSize: "0.9rem" }}>
                    {new Date(cliente.fechaCreacion).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Información de contacto */}
            <div className="card">
              <h3 style={{ margin: "0 0 1rem", color: "var(--verde)" }}>📞 Información de Contacto</h3>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <div className="flex">
                  <span style={{ fontWeight: "600", minWidth: "80px" }}>Teléfono:</span>
                  {cliente.telefono ? (
                    <a href={`tel:${cliente.telefono}`} style={{ color: "var(--verde)" }}>
                      📞 {cliente.telefono}
                    </a>
                  ) : (
                    <span style={{ color: "var(--texto-sec)" }}>No registrado</span>
                  )}
                </div>
                <div className="flex">
                  <span style={{ fontWeight: "600", minWidth: "80px" }}>Email:</span>
                  {cliente.correo ? (
                    <a href={`mailto:${cliente.correo}`} style={{ color: "var(--verde)" }}>
                      📧 {cliente.correo}
                    </a>
                  ) : (
                    <span style={{ color: "var(--texto-sec)" }}>No registrado</span>
                  )}
                </div>
                <div className="flex">
                  <span style={{ fontWeight: "600", minWidth: "80px" }}>Dirección:</span>
                  <span>{cliente.direccion || <span style={{ color: "var(--texto-sec)" }}>No registrada</span>}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex" style={{ marginTop: "1.5rem", gap: "1rem" }}>
            <button 
              className="btn btn--secondary btn--small"
              onClick={() => {
                // Navegar a la página de citas con el cliente preseleccionado
                navigate(`/appointments?clienteId=${cliente.idCliente}&clienteNombre=${encodeURIComponent(cliente.nombre)}`);
              }}
            >
              📅 Agendar Cita
            </button>
            <button 
              className="btn btn--secondary btn--small"
              onClick={abrirEditarModal}
            >
              📝 Editar Información
            </button>
            <button 
              className="btn btn--secondary btn--small"
              onClick={cargarHistorial}
              disabled={loading}
            >
              {loading ? "⏳ Cargando..." : "📊 Ver Historial"}
            </button>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {showEditModal && cliente && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto"
          }}>
            <h3 style={{ margin: "0 0 1rem", color: "var(--verde)" }}>📝 Editar Información</h3>
            <p style={{ margin: "0 0 1.5rem", color: "var(--texto-sec)" }}>
              Edita la información de {cliente.nombre}
            </p>
            
            <form onSubmit={guardarEdicion} className="form">
              <div className="form__row">
                <div className="form__group">
                  <label className="form__label">Nombre *</label>
                  <input
                    type="text"
                    className="form__input"
                    value={editForm.nombre}
                    onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form__group">
                  <label className="form__label">Teléfono</label>
                  <input
                    type="tel"
                    className="form__input"
                    value={editForm.telefono}
                    onChange={(e) => setEditForm({...editForm, telefono: e.target.value})}
                  />
                </div>
              </div>

              <div className="form__row">
                <div className="form__group">
                  <label className="form__label">Email</label>
                  <input
                    type="email"
                    className="form__input"
                    value={editForm.correo}
                    onChange={(e) => setEditForm({...editForm, correo: e.target.value})}
                  />
                </div>
                
                <div className="form__group">
                  <label className="form__label">Sector</label>
                  <input
                    type="text"
                    className="form__input"
                    value={editForm.sector}
                    onChange={(e) => setEditForm({...editForm, sector: e.target.value})}
                  />
                </div>
              </div>

              <div className="form__group">
                <label className="form__label">Dirección</label>
                <input
                  type="text"
                  className="form__input"
                  value={editForm.direccion}
                  onChange={(e) => setEditForm({...editForm, direccion: e.target.value})}
                />
              </div>
              
              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button 
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="btn btn--primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="loading__spinner" style={{ margin: 0, width: "1rem", height: "1rem" }}></div>
                      Guardando...
                    </>
                  ) : (
                    "💾 Guardar Cambios"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Historial */}
      {showHistorialModal && historialData && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            maxWidth: "700px",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto"
          }}>
            <h3 style={{ margin: "0 0 1rem", color: "var(--verde)" }}>📊 Historial del Cliente</h3>
            <p style={{ margin: "0 0 1.5rem", color: "var(--texto-sec)" }}>
              {historialData.cliente.nombre} - {historialData.cliente.rut}
            </p>
            
            {/* Estadísticas */}
            <div className="grid grid--3" style={{ marginBottom: "1.5rem" }}>
              <div className="card">
                <h4 style={{ margin: "0 0 0.5rem", color: "var(--verde)" }}>📅 Total Citas</h4>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--verde)" }}>
                  {historialData.estadisticas.totalCitas}
                </div>
              </div>
              <div className="card">
                <h4 style={{ margin: "0 0 0.5rem", color: "var(--verde)" }}>✅ Confirmadas</h4>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--verde)" }}>
                  {historialData.estadisticas.citasConfirmadas}
                </div>
              </div>
              <div className="card">
                <h4 style={{ margin: "0 0 0.5rem", color: "var(--verde)" }}>❌ Canceladas</h4>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--rojo)" }}>
                  {historialData.estadisticas.citasCanceladas}
                </div>
              </div>
            </div>

            {/* Lista de citas */}
            {historialData.citas.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Estado</th>
                      <th>Operativo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialData.citas.map((cita: any) => (
                      <tr key={cita.idCita}>
                        <td>
                          {new Date(cita.fechaHora).toLocaleDateString('es-CL')}
                        </td>
                        <td>
                          {new Date(cita.fechaHora).toLocaleTimeString('es-CL', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td>
                          <span style={{
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.25rem",
                            fontSize: "0.8rem",
                            ...getEstadoStyle(cita.estado)
                          }}>
                            {getEstadoLabel(cita.estado)}
                          </span>
                        </td>
                        <td>
                          {cita.operativo ? cita.operativo.nombre : "No asignado"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert--info">
                ℹ️ Este cliente no tiene citas registradas aún.
              </div>
            )}
            
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button 
                className="btn btn--secondary"
                onClick={() => setShowHistorialModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
