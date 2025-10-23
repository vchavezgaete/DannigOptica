import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";
import Layout from "./Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Leads from "./pages/Leads";
import Appointments from "./Appointments";
import AuthProvider from "./auth/AuthProvider"; 
import Clientes from "./pages/Clientes";
import Reportes from "./pages/Reportes";
import Oftalmologo from "./pages/Oftalmologo";
import "./index.css";


const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: "leads", element: <Leads /> },
              {
                path: "appointments",
                element: (
                  <RoleProtectedRoute requiredRole="oftalmologo">
                    <Appointments />
                  </RoleProtectedRoute>
                )
              },
      { path: "clientes", element: <Clientes /> },
      { 
        path: "oftalmologo", 
        element: (
          <RoleProtectedRoute requiredRole="oftalmologo">
            <Oftalmologo />
          </RoleProtectedRoute>
        )
      },
      { 
        path: "reportes", 
        element: (
          <RoleProtectedRoute requiredRole="admin">
            <Reportes />
          </RoleProtectedRoute>
        )
      },
    ],
  },
  // Redirect cualquier ruta no encontrada a /
  { path: "*", element: <Navigate to="/" replace /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
