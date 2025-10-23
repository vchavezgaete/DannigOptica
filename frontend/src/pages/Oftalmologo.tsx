import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import { api } from "../api";

// Types
type Cliente = {
  idCliente: number;
  rut: string;
  nombre: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  sector?: string;
  fechaCreacion: string;
};

type Cita = {
  idCita: number;
  fechaHora: string;
  estado: string;
  cliente: Cliente;
  ficha?: FichaClinica;
};

type FichaClinica = {
  idFicha: number;
  antecedentesGenerales?: string;
  antecedentesOftalmologicos?: string;
  observaciones?: string;
  fechaRegistro: string;
  recetas: Receta[];
};

type Receta = {
  idReceta: number;
  odEsfera?: number;
  odCilindro?: number;
  odEje?: number;
  oiEsfera?: number;
  oiCilindro?: number;
  oiEje?: number;
  adicion?: number;
  pd?: number;
  vigenciaDias?: number;
  fechaEmision: string;
};

type NuevaReceta = {
  odEsfera?: number;
  odCilindro?: number;
  odEje?: number;
  oiEsfera?: number;
  oiCilindro?: number;
  oiEje?: number;
  adicion?: number;
  pd?: number;
  vigenciaDias?: number;
};

export default function Oftalmologo() {
  const auth = useContext(AuthContext);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'citas' | 'clientes' | 'recetas'>('citas');
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [showRecetaModal, setShowRecetaModal] = useState(false);
  const [nuevaReceta, setNuevaReceta] = useState<NuevaReceta>({});
  const [savingReceta, setSavingReceta] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [citasRes, clientesRes] = await Promise.all([
        api.get<Cita[]>("/appointments"),
        api.get<Cliente[]>("/clientes")
      ]);
      setCitas(citasRes.data);
      setClientes(clientesRes.data);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar citas del día actual
  const citasHoy = citas.filter(cita => {
    const fechaCita = new Date(cita.fechaHora);
    const hoy = new Date();
    return fechaCita.toDateString() === hoy.toDateString();
  });

  // Generar receta
  const generarReceta = async () => {
    if (!selectedCita) return;
    
    setSavingReceta(true);
    try {
      // Primero crear o obtener ficha clínica
      let fichaId = selectedCita.ficha?.idFicha;
      
      if (!fichaId) {
        // Crear ficha clínica si no existe
        const fichaRes = await api.post("/fichas-clinicas", {
          idCita: selectedCita.idCita,
          antecedentesGenerales: "",
          antecedentesOftalmologicos: "",
          observaciones: ""
        });
        fichaId = fichaRes.data.idFicha;
      }

      // Crear receta
      await api.post("/recetas", {
        idFicha: fichaId,
        ...nuevaReceta
      });

      // Recargar datos
      await loadData();
      
      // Cerrar modal y limpiar formulario
      setShowRecetaModal(false);
      setNuevaReceta({});
      setSelectedCita(null);
      
      alert("✅ Receta generada exitosamente");
    } catch (error) {
      console.error("Error generando receta:", error);
      alert("❌ Error al generar la receta");
    } finally {
      setSavingReceta(false);
    }
  };

  const getEstadoBadgeStyle = (estado: string) => {
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

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case "Programada": return "Pendiente";
      case "Confirmada": return "Confirmada";
      case "Cancelada": return "Cancelada";
      case "NoShow": return "No Asistió";
      case "Atendida": return "Atendida";
      default: return estado;
    }
  };

  return (
    <div className="grid">
      {/* Header */}
      <div className="section">
        <div className="section__header">
          <h1 className="section__title">🩺 Módulo Oftalmólogo</h1>
          <p className="section__subtitle">
            Gestión de citas, fichas clínicas y generación de recetas médicas
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="section">
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
          <button
            className={`btn ${activeTab === 'citas' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setActiveTab('citas')}
          >
            📅 Citas del Día ({citasHoy.length})
          </button>
          <button
            className={`btn ${activeTab === 'clientes' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setActiveTab('clientes')}
          >
            👥 Todos los Clientes ({clientes.length})
          </button>
          <button
            className={`btn ${activeTab === 'recetas' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setActiveTab('recetas')}
          >
            📋 Historial de Recetas
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'citas' && (
          <div>
            <h2 className="section__title">📅 Citas Programadas para Hoy</h2>
            {loading ? (
              <div className="alert alert--info">Cargando citas...</div>
            ) : citasHoy.length === 0 ? (
              <div className="alert alert--info">
                ℹ️ No hay citas programadas para hoy.
              </div>
            ) : (
              <div className="table-container" style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Cliente</th>
                      <th>RUT</th>
                      <th>Estado</th>
                      <th>Ficha Clínica</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citasHoy.map((cita) => (
                      <tr key={cita.idCita}>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                            <span style={{ fontWeight: "600" }}>
                              🕐 {new Date(cita.fechaHora).toLocaleTimeString('es-CL', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span style={{ color: "var(--texto-sec)", fontSize: "0.9rem" }}>
                              📅 {new Date(cita.fechaHora).toLocaleDateString('es-CL', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short'
                              })}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontWeight: "600" }}>
                          {cita.cliente.nombre}
                        </td>
                        <td>
                          <code style={{ 
                            background: "var(--gris)", 
                            padding: "0.25rem 0.5rem", 
                            borderRadius: "0.25rem",
                            fontSize: "0.9rem"
                          }}>
                            {cita.cliente.rut}
                          </code>
                        </td>
                        <td>
                          <span
                            style={{
                              ...getEstadoBadgeStyle(cita.estado),
                              padding: "0.4rem 0.8rem",
                              borderRadius: "0.5rem",
                              fontSize: "0.85rem",
                              fontWeight: "600",
                              display: "inline-block"
                            }}
                          >
                            {getEstadoLabel(cita.estado)}
                          </span>
                        </td>
                        <td>
                          {cita.ficha ? (
                            <span style={{ color: "var(--verde)", fontWeight: "600" }}>
                              ✅ Disponible
                            </span>
                          ) : (
                            <span style={{ color: "var(--texto-sec)" }}>
                              ⚠️ Sin ficha
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              className="btn btn--secondary btn--small"
                              onClick={() => {
                                setSelectedCita(cita);
                                setShowRecetaModal(true);
                              }}
                              title="Generar Receta"
                            >
                              📋 Receta
                            </button>
                            <button
                              className="btn btn--primary btn--small"
                              onClick={() => {
                                // Marcar como atendida
                                // TODO: Implementar cambio de estado
                              }}
                              title="Marcar como Atendida"
                            >
                              ✅ Atendida
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'clientes' && (
          <div>
            <h2 className="section__title">👥 Base de Datos de Clientes</h2>
            {loading ? (
              <div className="alert alert--info">Cargando clientes...</div>
            ) : (
              <div className="table-container" style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>RUT</th>
                      <th>Teléfono</th>
                      <th>Correo</th>
                      <th>Sector</th>
                      <th>Fecha Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map((cliente) => (
                      <tr key={cliente.idCliente}>
                        <td>
                          <code style={{ 
                            background: "var(--gris)", 
                            padding: "0.25rem 0.5rem", 
                            borderRadius: "0.25rem",
                            fontSize: "0.9rem"
                          }}>
                            #{cliente.idCliente}
                          </code>
                        </td>
                        <td style={{ fontWeight: "600" }}>{cliente.nombre}</td>
                        <td>
                          <code style={{ 
                            background: "var(--gris)", 
                            padding: "0.25rem 0.5rem", 
                            borderRadius: "0.25rem",
                            fontSize: "0.9rem"
                          }}>
                            {cliente.rut}
                          </code>
                        </td>
                        <td>{cliente.telefono || "-"}</td>
                        <td>{cliente.correo || "-"}</td>
                        <td>{cliente.sector || "-"}</td>
                        <td>
                          {new Date(cliente.fechaCreacion).toLocaleDateString('es-CL')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recetas' && (
          <div>
            <h2 className="section__title">📋 Historial de Recetas Médicas</h2>
            <div className="alert alert--info">
              ℹ️ Esta sección mostrará el historial completo de recetas generadas.
              <br />
              <small>Funcionalidad en desarrollo - próximamente disponible.</small>
            </div>
          </div>
        )}
      </div>

      {/* Modal para generar receta */}
      {showRecetaModal && selectedCita && (
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
            borderRadius: "1rem",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "90vh",
            overflow: "auto"
          }}>
            <h3 style={{ marginBottom: "1rem" }}>
              📋 Generar Receta Médica
            </h3>
            
            <div style={{ marginBottom: "1rem", padding: "1rem", background: "#f8f9fa", borderRadius: "0.5rem" }}>
              <strong>Paciente:</strong> {selectedCita.cliente.nombre}<br />
              <strong>RUT:</strong> {selectedCita.cliente.rut}<br />
              <strong>Fecha:</strong> {new Date(selectedCita.fechaHora).toLocaleDateString('es-CL')}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              {/* Ojo Derecho */}
              <div>
                <h4 style={{ marginBottom: "0.5rem", color: "var(--verde)" }}>👁️ Ojo Derecho (OD)</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div>
                    <label style={{ fontSize: "0.9rem", fontWeight: "600" }}>Esfera:</label>
                    <input
                      type="number"
                      step="0.25"
                      className="form__input"
                      placeholder="0.00"
                      value={nuevaReceta.odEsfera || ""}
                      onChange={(e) => setNuevaReceta({...nuevaReceta, odEsfera: parseFloat(e.target.value) || undefined})}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.9rem", fontWeight: "600" }}>Cilindro:</label>
                    <input
                      type="number"
                      step="0.25"
                      className="form__input"
                      placeholder="0.00"
                      value={nuevaReceta.odCilindro || ""}
                      onChange={(e) => setNuevaReceta({...nuevaReceta, odCilindro: parseFloat(e.target.value) || undefined})}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.9rem", fontWeight: "600" }}>Eje:</label>
                    <input
                      type="number"
                      className="form__input"
                      placeholder="0"
                      value={nuevaReceta.odEje || ""}
                      onChange={(e) => setNuevaReceta({...nuevaReceta, odEje: parseInt(e.target.value) || undefined})}
                    />
                  </div>
                </div>
              </div>

              {/* Ojo Izquierdo */}
              <div>
                <h4 style={{ marginBottom: "0.5rem", color: "var(--verde)" }}>👁️ Ojo Izquierdo (OI)</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div>
                    <label style={{ fontSize: "0.9rem", fontWeight: "600" }}>Esfera:</label>
                    <input
                      type="number"
                      step="0.25"
                      className="form__input"
                      placeholder="0.00"
                      value={nuevaReceta.oiEsfera || ""}
                      onChange={(e) => setNuevaReceta({...nuevaReceta, oiEsfera: parseFloat(e.target.value) || undefined})}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.9rem", fontWeight: "600" }}>Cilindro:</label>
                    <input
                      type="number"
                      step="0.25"
                      className="form__input"
                      placeholder="0.00"
                      value={nuevaReceta.oiCilindro || ""}
                      onChange={(e) => setNuevaReceta({...nuevaReceta, oiCilindro: parseFloat(e.target.value) || undefined})}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.9rem", fontWeight: "600" }}>Eje:</label>
                    <input
                      type="number"
                      className="form__input"
                      placeholder="0"
                      value={nuevaReceta.oiEje || ""}
                      onChange={(e) => setNuevaReceta({...nuevaReceta, oiEje: parseInt(e.target.value) || undefined})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Parámetros adicionales */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.9rem", fontWeight: "600" }}>Adición:</label>
                <input
                  type="number"
                  step="0.25"
                  className="form__input"
                  placeholder="0.00"
                  value={nuevaReceta.adicion || ""}
                  onChange={(e) => setNuevaReceta({...nuevaReceta, adicion: parseFloat(e.target.value) || undefined})}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.9rem", fontWeight: "600" }}>PD (mm):</label>
                <input
                  type="number"
                  step="0.5"
                  className="form__input"
                  placeholder="0.0"
                  value={nuevaReceta.pd || ""}
                  onChange={(e) => setNuevaReceta({...nuevaReceta, pd: parseFloat(e.target.value) || undefined})}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.9rem", fontWeight: "600" }}>Vigencia (días):</label>
                <input
                  type="number"
                  className="form__input"
                  placeholder="365"
                  value={nuevaReceta.vigenciaDias || ""}
                  onChange={(e) => setNuevaReceta({...nuevaReceta, vigenciaDias: parseInt(e.target.value) || undefined})}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button
                className="btn btn--secondary"
                onClick={() => {
                  setShowRecetaModal(false);
                  setNuevaReceta({});
                  setSelectedCita(null);
                }}
                disabled={savingReceta}
              >
                Cancelar
              </button>
              <button
                className="btn btn--primary"
                onClick={generarReceta}
                disabled={savingReceta}
              >
                {savingReceta ? (
                  <>
                    <div className="loading__spinner" style={{ margin: 0, width: "1rem", height: "1rem" }}></div>
                    Guardando...
                  </>
                ) : (
                  "💾 Generar Receta"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
