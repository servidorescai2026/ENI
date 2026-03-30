// src/RutaProtegida.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const RutaProtegida = ({ children, rolRequerido }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const requiereCambioPassword = localStorage.getItem("requiereCambioPassword") === "true";

  if (!token || !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (requiereCambioPassword && location.pathname !== "/configuracion") {
    return <Navigate to="/configuracion" replace />;
  }

  if (rolRequerido && usuario.rol !== rolRequerido) {
    return <Navigate to="/usuario" replace />;
  }

  return children;
};

export default RutaProtegida;
