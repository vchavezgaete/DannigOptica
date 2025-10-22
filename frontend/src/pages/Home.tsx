import { useEffect, useState } from "react";
import { api } from "../api";

type Producto = { 
  idProducto: number; 
  codigo: string; 
  nombre: string; 
  precio: string; 
  tipo: string | null; 
};

export default function Home() {
  const [data, setData] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try { 
        const res = await api.get<Producto[]>("/productos"); 
        setData(res.data); 
      }
      catch { 
        setErr("No se pudo cargar productos"); 
      }
      finally { 
        setLoading(false); 
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading__spinner"></div>
        Cargando productos...
      </div>
    );
  }

  if (err) {
    return (
      <div className="alert alert--error">
        ❌ {err}
      </div>
    );
  }

  return (
    <div className="grid">
      {/* Welcome Section */}
      <div className="section">
        <div className="section__header">
          <h1 className="section__title">🏠 Bienvenido a Dannig Óptica</h1>
          <p className="section__subtitle">
            Sistema de gestión integral para captación y gestión de clientes
          </p>
        </div>
        
        <div className="grid grid--3">
          <div className="card">
            <h3 style={{ margin: "0 0 0.5rem", color: "var(--verde)" }}>📋 Captación</h3>
            <p style={{ margin: 0, color: "var(--texto-sec)" }}>
              Módulo para captadores: Registra clientes captados en terreno con sus datos de contacto
            </p>
          </div>
          
          <div className="card">
            <h3 style={{ margin: "0 0 0.5rem", color: "var(--verde)" }}>📅 Citas</h3>
            <p style={{ margin: 0, color: "var(--texto-sec)" }}>
              Programa y administra las citas con los clientes captados
            </p>
          </div>
          
          <div className="card">
            <h3 style={{ margin: "0 0 0.5rem", color: "var(--verde)" }}>👥 Clientes</h3>
            <p style={{ margin: 0, color: "var(--texto-sec)" }}>
              Consulta la información completa de los clientes en el sistema
            </p>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="section">
        <div className="section__header">
          <h2 className="section__title">🛍️ Catálogo de Productos</h2>
          <p className="section__subtitle">
            {data.length} productos disponibles en el sistema
          </p>
        </div>

        {data.length === 0 ? (
          <div className="alert alert--info">
            ℹ️ No hay productos registrados en el sistema
          </div>
        ) : (
          <div className="table-container" style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {data.map(p => (
                  <tr key={p.idProducto}>
                    <td>
                      <code style={{ 
                        background: "var(--gris)", 
                        padding: "0.25rem 0.5rem", 
                        borderRadius: "0.25rem",
                        fontSize: "0.9rem"
                      }}>
                        {p.codigo}
                      </code>
                    </td>
                    <td style={{ fontWeight: "600" }}>{p.nombre}</td>
                    <td style={{ color: "var(--verde)", fontWeight: "600" }}>
                      ${parseInt(p.precio).toLocaleString()}
                    </td>
                    <td>
                      {p.tipo ? (
                        <span style={{
                          background: "var(--acento)",
                          color: "white",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.25rem",
                          fontSize: "0.8rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em"
                        }}>
                          {p.tipo}
                        </span>
                      ) : (
                        <span style={{ color: "var(--texto-sec)" }}>-</span>
                      )}
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
