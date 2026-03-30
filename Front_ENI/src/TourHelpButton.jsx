import React from "react";
import { useLocation } from "react-router-dom";
import { iniciarTourPorRuta } from "./utils/tours";

const rutasConAyuda = new Set([
  "/login",
  "/register",
  "/admin",
  "/administrador",
  "/usuario",
  "/gestion-cursos",
  "/gestion-usuarios",
  "/upload-usuarios",
  "/cursos-disponibles",
  "/verificar-mis-cursos",
  "/notificaciones",
  "/mis-notificaciones",
  "/subir-evidencias",
  "/configuracion",
  "/monitoria",
  "/reportes",
]);

export default function TourHelpButton() {
  const { pathname } = useLocation();

  if (!rutasConAyuda.has(pathname)) {
    return null;
  }

  return (
    <button
      type="button"
      className="btn-tour"
      onClick={() => iniciarTourPorRuta(pathname)}
      title="Ver guia de uso"
      aria-label="Abrir guia de ayuda"
    >
      <span className="btn-tour-icon" aria-hidden="true">❔</span>
      <span className="btn-tour-text">Ayuda</span>
    </button>
  );
}
