/**
 * Página de gestión de ventas
 * 
 * Esta página permite:
 * - Registrar nuevas ventas de productos ópticos
 * - Asociar ventas con recetas oftalmológicas
 * - Agregar múltiples productos a una venta
 * - Registrar garantías para productos vendidos
 * - Visualizar historial de ventas
 * 
 * Funcionalidades principales:
 * 1. Búsqueda de cliente por RUT
 * 2. Selección de receta asociada (opcional)
 * 3. Agregar productos con cantidad y precio unitario
 * 4. Cálculo automático del total de la venta
 * 5. Registro de garantías por item de venta
 */

import { useState, useEffect, useContext } from "react";
import { api } from "../api";
import { AuthContext } from "../auth/AuthContext";

// Tipo para representar un cliente
type Cliente = {
  idCliente: number;
  rut: string;
  nombre: string;
  telefono?: string | null;
  correo?: string | null;
};

type Producto = {
  idProducto: number;
  codigo: string;
  nombre: string;
  precio: string;
  tipo: string | null;
};

type Receta = {
  idReceta: number;
  fechaEmision: string;
  ficha?: {
    cita: {
      cliente: Cliente;
    };
  };
};

type ItemVenta = {
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
  producto?: Producto;
};

type Venta = {
  idVenta: number;
  fechaVenta: string;
  total: string;
  cliente: Cliente;
  receta?: Receta | null;
  items: Array<{
    idItem: number;
    cantidad: number;
    precioUnitario: string;
    producto: Producto;
    garantia?: {
      idGarantia: number;
      fechaInicio: string;
      fechaFin: string;
      condiciones?: string | null;
    } | null;
  }>;
};

export default function Ventas() {
  const auth = useContext(AuthContext);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  
  // Formulario de nueva venta
  const [clienteRut, setClienteRut] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState<number | null>(null);
  const [items, setItems] = useState<ItemVenta[]>([]);
  const [showAgregarProducto, setShowAgregarProducto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<number | null>(null);
  const [cantidadProducto, setCantidadProducto] = useState(1);
  const [precioUnitario, setPrecioUnitario] = useState(0);
  
  // Modal de garantía
  const [showGarantiaModal, setShowGarantiaModal] = useState(false);
  const [itemGarantia, setItemGarantia] = useState<number | null>(null);
  const [fechaInicioGarantia, setFechaInicioGarantia] = useState("");
  const [fechaFinGarantia, setFechaFinGarantia] = useState("");
  const [condicionesGarantia, setCondicionesGarantia] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => setMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  const loadData = async () => {
    setLoading(true);
    setErr(null);
    try {
      const [clientesRes, productosRes, ventasRes] = await Promise.all([
        api.get<Cliente[]>("/clientes"),
        api.get<Producto[]>("/productos"),
        api.get<Venta[]>("/ventas")
      ]);
      setClientes(clientesRes.data);
      setProductos(productosRes.data);
      setVentas(ventasRes.data);
    } catch (error: any) {
      setErr(error.response?.data?.error || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const buscarCliente = async () => {
    if (!clienteRut.trim()) {
      setErr("Ingresa un RUT para buscar");
      return;
    }

    setLoading(true);
    setErr(null);
    try {
      const res = await api.get<Cliente>("/clientes", {
        params: { rut: clienteRut.trim() }
      });
      
      if (res.data) {
        setClienteSeleccionado(res.data);
        // Cargar recetas del cliente
        loadRecetasCliente(res.data.idCliente);
      } else {
        setErr("Cliente no encontrado");
        setClienteSeleccionado(null);
      }
    } catch (error: any) {
      setErr(error.response?.data?.error || "Cliente no encontrado");
      setClienteSeleccionado(null);
    } finally {
      setLoading(false);
    }
  };

  const loadRecetasCliente = async (idCliente: number) => {
    try {
      // Obtener todas las recetas y filtrar por cliente
      const res = await api.get<Receta[]>("/recetas", {
        params: { clienteId: idCliente.toString() }
      });
      // Las recetas vienen con la estructura ficha.cita.cliente
      const recetasFiltradas = res.data.filter((receta: any) => 
        receta.ficha?.cita?.cliente?.idCliente === idCliente
      );
      setRecetas(recetasFiltradas);
    } catch (error) {
      console.error("Error cargando recetas:", error);
      // Si falla, intentar obtener todas y filtrar manualmente
      try {
        const todasRecetas = await api.get<Receta[]>("/recetas");
        const recetasFiltradas = todasRecetas.data.filter((receta: any) => 
          receta.ficha?.cita?.cliente?.idCliente === idCliente
        );
        setRecetas(recetasFiltradas);
      } catch (e) {
        console.error("Error al cargar recetas:", e);
      }
    }
  };

  const agregarProducto = () => {
    if (!productoSeleccionado || cantidadProducto <= 0 || precioUnitario <= 0) {
      setErr("Completa todos los campos del producto");
      return;
    }

    const producto = productos.find(p => p.idProducto === productoSeleccionado);
    if (!producto) {
      setErr("Producto no encontrado");
      return;
    }

    // Verificar si el producto ya está en la lista
    const existe = items.find(item => item.idProducto === productoSeleccionado);
    if (existe) {
      setErr("Este producto ya está en la venta. Edita la cantidad si es necesario.");
      return;
    }

    setItems([...items, {
      idProducto: productoSeleccionado,
      cantidad: cantidadProducto,
      precioUnitario: precioUnitario,
      producto
    }]);

    // Resetear formulario
    setProductoSeleccionado(null);
    setCantidadProducto(1);
    setPrecioUnitario(0);
    setShowAgregarProducto(false);
    setErr(null);
  };

  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    return items.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
  };

  const crearVenta = async () => {
    if (!clienteSeleccionado) {
      setErr("Selecciona un cliente");
      return;
    }

    if (items.length === 0) {
      setErr("Agrega al menos un producto a la venta");
      return;
    }

    setLoading(true);
    setErr(null);
    try {
      const ventaData = {
        idCliente: clienteSeleccionado.idCliente,
        idReceta: recetaSeleccionada || null,
        items: items.map(item => ({
          idProducto: item.idProducto,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario
        }))
      };

      const res = await api.post<Venta>("/ventas", ventaData);
      setMsg(`✅ Venta creada exitosamente. Total: $${Number(res.data.total).toLocaleString()}`);
      
      // Limpiar formulario
      setClienteSeleccionado(null);
      setClienteRut("");
      setRecetaSeleccionada(null);
      setItems([]);
      
      // Recargar ventas
      await loadData();
    } catch (error: any) {
      setErr(error.response?.data?.error || "Error al crear la venta");
    } finally {
      setLoading(false);
    }
  };

  const crearGarantia = async () => {
    if (!itemGarantia || !fechaInicioGarantia || !fechaFinGarantia) {
      setErr("Completa las fechas de la garantía");
      return;
    }

    if (new Date(fechaFinGarantia) < new Date(fechaInicioGarantia)) {
      setErr("La fecha de fin debe ser posterior a la fecha de inicio");
      return;
    }

    setLoading(true);
    setErr(null);
    try {
      await api.post("/garantias", {
        idItem: itemGarantia,
        fechaInicio: fechaInicioGarantia,
        fechaFin: fechaFinGarantia,
        condiciones: condicionesGarantia || null
      });

      setMsg("✅ Garantía registrada exitosamente");
      setShowGarantiaModal(false);
      setItemGarantia(null);
      setFechaInicioGarantia("");
      setFechaFinGarantia("");
      setCondicionesGarantia("");
      
      await loadData();
    } catch (error: any) {
      setErr(error.response?.data?.error || "Error al crear la garantía");
    } finally {
      setLoading(false);
    }
  };

  const abrirGarantiaModal = (idItem: number) => {
    setItemGarantia(idItem);
    const hoy = new Date().toISOString().split('T')[0];
    setFechaInicioGarantia(hoy);
    const unAno = new Date();
    unAno.setFullYear(unAno.getFullYear() + 1);
    setFechaFinGarantia(unAno.toISOString().split('T')[0]);
    setShowGarantiaModal(true);
  };

  return (
    <div className="grid">
      {/* Header */}
      <div className="section">
        <div className="section__header">
          <h1 className="section__title">💰 Gestión de Ventas</h1>
          <p className="section__subtitle">
            Registra ventas y gestiona garantías de productos
          </p>
        </div>
      </div>

      {/* Alertas */}
      {msg && <div className="alert alert--success">✅ {msg}</div>}
      {err && <div className="alert alert--error">❌ {err}</div>}

      {/* Nueva Venta */}
      <div className="section">
        <div className="section__header">
          <h2 className="section__title">➕ Nueva Venta</h2>
        </div>

        {/* Búsqueda de Cliente */}
        <div className="form">
          <div className="form__row">
            <div className="form__group" style={{ flex: 1 }}>
              <label className="form__label">Buscar Cliente por RUT *</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  className="form__input"
                  placeholder="Ej: 12345678-9"
                  value={clienteRut}
                  onChange={(e) => setClienteRut(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && buscarCliente()}
                />
                <button
                  className="btn btn--secondary"
                  onClick={buscarCliente}
                  disabled={loading}
                >
                  🔍 Buscar
                </button>
              </div>
            </div>
          </div>

          {clienteSeleccionado && (
            <div className="alert alert--success" style={{ marginTop: "1rem" }}>
              <strong>Cliente seleccionado:</strong> {clienteSeleccionado.nombre} - {clienteSeleccionado.rut}
            </div>
          )}

          {/* Selección de Receta (Opcional) */}
          {clienteSeleccionado && recetas.length > 0 && (
            <div className="form__group" style={{ marginTop: "1rem" }}>
              <label className="form__label">Receta Asociada (Opcional)</label>
              <select
                className="form__input"
                value={recetaSeleccionada || ""}
                onChange={(e) => setRecetaSeleccionada(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Sin receta</option>
                {recetas.map(receta => (
                  <option key={receta.idReceta} value={receta.idReceta}>
                    Receta #{receta.idReceta} - {new Date(receta.fechaEmision).toLocaleDateString('es-CL')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Items de Venta */}
          {clienteSeleccionado && (
            <>
              <div style={{ marginTop: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ margin: 0 }}>Productos en la Venta</h3>
                  <button
                    className="btn btn--primary btn--small"
                    onClick={() => setShowAgregarProducto(!showAgregarProducto)}
                  >
                    ➕ Agregar Producto
                  </button>
                </div>

                {showAgregarProducto && (
                  <div className="card" style={{ marginBottom: "1rem", padding: "1.5rem" }}>
                    <h4 style={{ marginTop: 0 }}>Agregar Producto</h4>
                    <div className="form__row">
                      <div className="form__group" style={{ flex: 2 }}>
                        <label className="form__label">Producto *</label>
                        <select
                          className="form__input"
                          value={productoSeleccionado || ""}
                          onChange={(e) => {
                            const prodId = Number(e.target.value);
                            setProductoSeleccionado(prodId);
                            const prod = productos.find(p => p.idProducto === prodId);
                            if (prod) {
                              setPrecioUnitario(Number(prod.precio));
                            }
                          }}
                        >
                          <option value="">Selecciona un producto</option>
                          {productos.map(prod => (
                            <option key={prod.idProducto} value={prod.idProducto}>
                              {prod.nombre} - ${Number(prod.precio).toLocaleString()}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form__group">
                        <label className="form__label">Cantidad *</label>
                        <input
                          type="number"
                          min="1"
                          className="form__input"
                          value={cantidadProducto}
                          onChange={(e) => setCantidadProducto(Number(e.target.value))}
                        />
                      </div>
                      <div className="form__group">
                        <label className="form__label">Precio Unitario *</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form__input"
                          value={precioUnitario}
                          onChange={(e) => setPrecioUnitario(Number(e.target.value))}
                        />
                      </div>
                      <div className="form__group" style={{ display: "flex", alignItems: "flex-end" }}>
                        <button
                          className="btn btn--primary"
                          onClick={agregarProducto}
                        >
                          ✅ Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {items.length === 0 ? (
                  <div className="alert alert--info">
                    No hay productos en la venta. Agrega productos para continuar.
                  </div>
                ) : (
                  <>
                    <div className="table-container" style={{ overflowX: "auto" }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Subtotal</th>
                            <th>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => {
                            const producto = productos.find(p => p.idProducto === item.idProducto);
                            return (
                              <tr key={index}>
                                <td>{producto?.nombre || `Producto #${item.idProducto}`}</td>
                                <td>{item.cantidad}</td>
                                <td>${item.precioUnitario.toLocaleString()}</td>
                                <td style={{ fontWeight: "600", color: "var(--verde)" }}>
                                  ${(item.precioUnitario * item.cantidad).toLocaleString()}
                                </td>
                                <td>
                                  <button
                                    className="btn btn--secondary btn--small"
                                    onClick={() => eliminarItem(index)}
                                  >
                                    🗑️
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ fontWeight: "600", fontSize: "1.1rem" }}>
                            <td colSpan={3} style={{ textAlign: "right" }}>TOTAL:</td>
                            <td style={{ color: "var(--verde)", fontSize: "1.2rem" }}>
                              ${calcularTotal().toLocaleString()}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
                      <button
                        className="btn btn--primary"
                        onClick={crearVenta}
                        disabled={loading}
                      >
                        {loading ? "⏳ Guardando..." : "💰 Registrar Venta"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Historial de Ventas */}
      <div className="section">
        <div className="section__header">
          <h2 className="section__title">📋 Historial de Ventas</h2>
          <p className="section__subtitle">
            {ventas.length} ventas registradas
          </p>
        </div>

        {loading && ventas.length === 0 ? (
          <div className="alert alert--info">Cargando ventas...</div>
        ) : ventas.length === 0 ? (
          <div className="alert alert--info">
            No hay ventas registradas aún
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {ventas.map(venta => (
              <div key={venta.idVenta} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                  <div>
                    <h3 style={{ margin: "0 0 0.5rem" }}>
                      Venta #{venta.idVenta}
                    </h3>
                    <p style={{ margin: "0.25rem 0", color: "var(--texto-sec)" }}>
                      <strong>Cliente:</strong> {venta.cliente.nombre} ({venta.cliente.rut})
                    </p>
                    <p style={{ margin: "0.25rem 0", color: "var(--texto-sec)" }}>
                      <strong>Fecha:</strong> {new Date(venta.fechaVenta).toLocaleString('es-CL')}
                    </p>
                    {venta.receta && (
                      <p style={{ margin: "0.25rem 0", color: "var(--texto-sec)" }}>
                        <strong>Receta:</strong> #{venta.receta.idReceta} ({new Date(venta.receta.fechaEmision).toLocaleDateString('es-CL')})
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--verde)" }}>
                      ${Number(venta.total).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="table-container" style={{ overflowX: "auto", marginTop: "1rem" }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unit.</th>
                        <th>Subtotal</th>
                        <th>Garantía</th>
                      </tr>
                    </thead>
                    <tbody>
                      {venta.items.map(item => (
                        <tr key={item.idItem}>
                          <td>{item.producto.nombre}</td>
                          <td>{item.cantidad}</td>
                          <td>${Number(item.precioUnitario).toLocaleString()}</td>
                          <td>${(Number(item.precioUnitario) * item.cantidad).toLocaleString()}</td>
                          <td>
                            {item.garantia ? (
                              <span style={{ color: "var(--verde)", fontSize: "0.9rem" }}>
                                ✅ Hasta {new Date(item.garantia.fechaFin).toLocaleDateString('es-CL')}
                              </span>
                            ) : (
                              <button
                                className="btn btn--secondary btn--small"
                                onClick={() => abrirGarantiaModal(item.idItem)}
                              >
                                ➕ Agregar Garantía
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Garantía */}
      {showGarantiaModal && (
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
            maxWidth: "500px",
            width: "90%"
          }}>
            <h3 style={{ marginTop: 0 }}>📋 Registrar Garantía</h3>
            
            <div className="form">
              <div className="form__group">
                <label className="form__label">Fecha de Inicio *</label>
                <input
                  type="date"
                  className="form__input"
                  value={fechaInicioGarantia}
                  onChange={(e) => setFechaInicioGarantia(e.target.value)}
                />
              </div>
              <div className="form__group">
                <label className="form__label">Fecha de Fin *</label>
                <input
                  type="date"
                  className="form__input"
                  value={fechaFinGarantia}
                  onChange={(e) => setFechaFinGarantia(e.target.value)}
                />
              </div>
              <div className="form__group">
                <label className="form__label">Condiciones (Opcional)</label>
                <textarea
                  className="form__input"
                  rows={3}
                  value={condicionesGarantia}
                  onChange={(e) => setCondicionesGarantia(e.target.value)}
                  placeholder="Condiciones especiales de la garantía..."
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button
                className="btn btn--secondary"
                onClick={() => {
                  setShowGarantiaModal(false);
                  setItemGarantia(null);
                }}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="btn btn--primary"
                onClick={crearGarantia}
                disabled={loading}
              >
                {loading ? "⏳ Guardando..." : "💾 Registrar Garantía"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

