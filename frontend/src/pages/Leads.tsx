// src/pages/Leads.tsx
import { useEffect, useState, useCallback, type FormEvent } from "react";
import { isAxiosError } from "axios";
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

type LeadForm = {
  nombre: string;
  documento: string;
  contacto: string;
  direccion: string;
  sector: string;
};

function extractMsg(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const o = data as Record<string, unknown>;
  // claves típicas
  for (const k of ["message", "error", "msg", "detail", "descripcion"]) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  // patrones { errors: [{ message: "..." }] }
  const errs = (o as { errors?: Array<{ message?: unknown }> }).errors;
  if (Array.isArray(errs) && typeof errs[0]?.message === "string") {
    return errs[0].message as string;
  }
  return undefined;
}

export default function Leads() {
  const [list, setList] = useState<Cliente[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<LeadForm>({
    nombre: "",
    documento: "",
    contacto: "",
    direccion: "",
    sector: "",
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // limpia el mensaje verde a los 3s
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(t);
  }, [msg]);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const { data } = await api.get<Cliente[]>("/leads", { params: { q, limit: 100 } });
      setList(data);
    } catch (e) {
      const m = isAxiosError(e) ? extractMsg(e.response?.data) ?? e.message : "Error al cargar leads";
      setErr(m);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createLead(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setLoading(true);
    try {
      const res = await api.post("/leads", form);
      const okMsg = extractMsg(res.data) ?? (res.status === 201 ? "Lead creado" : "Guardado");
      setMsg(okMsg);
      setForm({ nombre: "", documento: "", contacto: "", direccion: "", sector: "" });
      await load();
    } catch (e) {
      const m = isAxiosError(e) ? extractMsg(e.response?.data) ?? e.message : "Error al crear lead";
      setErr(m);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid">
      {/* Header */}
      <div className="section">
        <div className="section__header">
          <h1 className="section__title">📋 Captación de Clientes</h1>
          <p className="section__subtitle">
            Módulo para captadores: Registra los clientes captados en terreno
          </p>
        </div>
        
        {/* Info box para captadores */}
        <div className="alert alert--info" style={{ marginTop: "1rem" }}>
          <strong>📌 Instrucciones para Captadores:</strong>
          <ul style={{ margin: "0.5rem 0 0 1.5rem", paddingLeft: 0 }}>
            <li>Completa todos los datos del cliente captado en terreno</li>
            <li>Verifica que el RUT sea correcto antes de registrar</li>
            <li>Agrega el contacto (teléfono o email) para futuras comunicaciones</li>
            <li>El sector ayuda a organizar las visitas por zona geográfica</li>
          </ul>
        </div>
      </div>

      {/* Alertas */}
      {msg && <div className="alert alert--success">✅ {msg}</div>}
      {err && <div className="alert alert--error">❌ {err}</div>}

      {/* Formulario de creación */}
      <div className="section">
        <div className="section__header">
          <h2 className="section__title">➕ Registrar Cliente Captado</h2>
          <p className="section__subtitle">Ingresa los datos del cliente que acabas de captar</p>
        </div>

        <form onSubmit={createLead} className="form">
          <div className="form__row">
            <div className="form__group">
              <label className="form__label">Nombre Completo *</label>
              <input 
                className="form__input"
                placeholder="Ej: Juan Pérez González" 
                value={form.nombre} 
                onChange={(e) => setForm({ ...form, nombre: e.target.value })} 
                required 
              />
            </div>
            <div className="form__group">
              <label className="form__label">RUT *</label>
              <input 
                className="form__input"
                placeholder="12.345.678-9" 
                value={form.documento} 
                onChange={(e) => setForm({ ...form, documento: e.target.value })} 
                required 
              />
            </div>
          </div>
          
          <div className="form__row">
            <div className="form__group">
              <label className="form__label">Contacto</label>
              <input 
                className="form__input"
                placeholder="Teléfono o email" 
                value={form.contacto} 
                onChange={(e) => setForm({ ...form, contacto: e.target.value })} 
              />
            </div>
            <div className="form__group">
              <label className="form__label">Sector</label>
              <input 
                className="form__input"
                placeholder="Ej: Las Condes, Providencia" 
                value={form.sector} 
                onChange={(e) => setForm({ ...form, sector: e.target.value })} 
              />
            </div>
          </div>

          <div className="form__group">
            <label className="form__label">Dirección</label>
            <input 
              className="form__input"
              placeholder="Dirección completa" 
              value={form.direccion} 
              onChange={(e) => setForm({ ...form, direccion: e.target.value })} 
            />
          </div>

          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? (
              <>
                <div className="loading__spinner" style={{ margin: 0, width: "1rem", height: "1rem" }}></div>
                Registrando...
              </>
            ) : (
              "✅ Registrar Captación"
            )}
          </button>
        </form>
      </div>

      {/* Búsqueda y filtros */}
      <div className="section">
        <div className="section__header">
          <h2 className="section__title">🔍 Clientes Captados</h2>
          <p className="section__subtitle">
            {list.length} clientes captados registrados en el sistema
          </p>
        </div>

        <div className="flex">
          <input 
            className="form__input"
            placeholder="Buscar por nombre, RUT, contacto..." 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            style={{ flex: 1 }}
          />
          <button onClick={() => void load()} className="btn btn--secondary btn--small">
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Tabla de leads */}
      <div className="section">
        <div className="table-container" style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>RUT</th>
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Dirección</th>
                <th>Sector</th>
                <th>Fecha Registro</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--texto-sec)" }}>
                    {q ? "No se encontraron clientes captados con ese criterio" : "No hay clientes captados registrados aún"}
                  </td>
                </tr>
              ) : (
                list.map((c) => (
                  <tr key={c.idCliente}>
                    <td>
                      <code style={{ 
                        background: "var(--gris)", 
                        padding: "0.25rem 0.5rem", 
                        borderRadius: "0.25rem",
                        fontSize: "0.9rem"
                      }}>
                        {c.rut}
                      </code>
                    </td>
                    <td style={{ fontWeight: "600" }}>{c.nombre}</td>
                    <td>
                      {c.correo ? (
                        <a href={`mailto:${c.correo}`} style={{ color: "var(--verde)" }}>
                          📧 {c.correo}
                        </a>
                      ) : c.telefono ? (
                        <a href={`tel:${c.telefono}`} style={{ color: "var(--verde)" }}>
                          📞 {c.telefono}
                        </a>
                      ) : (
                        <span style={{ color: "var(--texto-sec)" }}>-</span>
                      )}
                    </td>
                    <td>{c.direccion || <span style={{ color: "var(--texto-sec)" }}>-</span>}</td>
                    <td>{c.sector || <span style={{ color: "var(--texto-sec)" }}>-</span>}</td>
                    <td style={{ color: "var(--texto-sec)", fontSize: "0.9rem" }}>
                      {new Date(c.fechaCreacion).toLocaleDateString('es-CL')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
