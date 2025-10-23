import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./auth/AuthContext";
import type { AuthContextType } from "./auth/types";

export default function Layout() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext) as AuthContextType;

  const handleLogout = () => {
    auth.logout();
    navigate("/login");
  };

  return (
    <div className="page">
      {/* Topbar */}
      <div className="topbar" role="region" aria-label="Barra de contacto">
        <div className="topbar__inner">
          <span className="badge">Sistema</span>
          <span>+56 9 3260 9541</span> • <span>+56 9 4055 9027</span>
        </div>
      </div>

      {/* Header */}
      <header className="header">
        <div className="header__inner">
          <div className="brand" aria-label="Dannig Óptica">
            <img 
              src="https://dannig.cl/wp-content/uploads/2025/02/Logo-dannig.png" 
              alt="Dannig Óptica" 
            />
            <div className="brand__name">DANNIG ÓPTICA</div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <a 
              className="cta" 
              href="https://wa.me/56932609541" 
              target="_blank" 
              rel="noopener"
            >
              Agenda por WhatsApp
            </a>
            <button 
              onClick={handleLogout}
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid var(--verde)",
                borderRadius: "0.5rem",
                background: "transparent",
                color: "var(--verde)",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav">
        <div className="nav__inner">
          <NavLink to="/" end className="nav__link">
            🏠 Inicio
          </NavLink>
          <NavLink to="/leads" className="nav__link">
            📋 Captación
          </NavLink>
            {/* Clientes visible para captadores, oftalmólogo y admin */}
            {(auth.hasRole('captador') || auth.hasRole('oftalmologo') || auth.hasRole('admin')) && (
              <NavLink to="/clientes" className="nav__link">
                👥 Clientes
              </NavLink>
            )}
            {/* Agendamiento de horas visible para oftalmólogo y admin */}
            {(auth.hasRole('oftalmologo') || auth.hasRole('admin')) && (
              <NavLink to="/appointments" className="nav__link">
                📅 Agendamiento de Horas
              </NavLink>
            )}
            {/* Solo admin ve reportes */}
            {auth.hasRole('admin') && (
              <NavLink to="/reportes" className="nav__link">
                📊 Reportes
              </NavLink>
            )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="main">
        <Outlet />
      </main>

      {/* Footer */}
      <footer>
        <div className="footer__inner">
          <div>Av. Pajaritos #3195, piso 13 oficina 1318, Maipú</div>
          <div>© 2025 Dannig Óptica</div>
        </div>
      </footer>
    </div>
  );
}
