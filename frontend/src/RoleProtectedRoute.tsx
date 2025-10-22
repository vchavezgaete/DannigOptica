import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "./auth/AuthContext";

type Props = { 
  children?: React.ReactNode;
  requiredRole: string;
};

export default function RoleProtectedRoute({ children, requiredRole }: Props) {
  const auth = useContext(AuthContext);

  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }

  if (!auth.hasRole(requiredRole)) {
    return (
      <div style={{ 
        padding: "2rem", 
        textAlign: "center",
        color: "var(--texto-sec)"
      }}>
        <h2>🔒 Acceso Restringido</h2>
        <p>No tienes permisos para acceder a esta sección.</p>
        <p>Se requiere rol: <strong>{requiredRole}</strong></p>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
