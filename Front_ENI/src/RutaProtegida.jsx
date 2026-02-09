// src/RutaProtegida.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const RutaProtegida = ({ children, rolRequerido }) => {
  const token = localStorage.getItem("token");
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  if (!token || !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (rolRequerido && usuario.rol !== rolRequerido) {
    return <Navigate to="/usuario" replace />;
  }

  return children;
};

export default RutaProtegida;
