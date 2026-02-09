import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Principal from "./Principal";
import Registro from "./Register";
import Login from "./Login";
import Usuario from "./Usuario";
import RutaProtegida from "./RutaProtegida";
import Administrador from "./Admin";
import GestionCursos from "./GestionCursos";
import CursosDisponibles from "./CursosDisponibles";
import VerificarMisCursos from "./VerificarMisCursos";
import EnviarNotificacionPorArea from "./notificaciones";
import MisNotificaciones from "./MisNotificaciones";
import SubirEvidencias from "./SubirEvidencias";
import "./css/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Principal />} />
        <Route path="/register" element={<Registro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/notificaciones" element={<EnviarNotificacionPorArea />} />
        <Route
          path="/mis-notificaciones"
          element={
            <RutaProtegida>
              <MisNotificaciones />
            </RutaProtegida>
          }
        />
        <Route
          path="/subir-evidencias"
          element={
            <RutaProtegida>
              <SubirEvidencias />
            </RutaProtegida>
          }
        />


        <Route
          path="/usuario"
          element={
            <RutaProtegida>
              <Usuario />
            </RutaProtegida>
          }
        />

        <Route
          path="/admin"
          element={
            <RutaProtegida rolRequerido="Administrador">
              <Administrador />
            </RutaProtegida>
          }
        />

        <Route
          path="/gestion-cursos"
          element={
            <RutaProtegida rolRequerido="Administrador">
              <GestionCursos />
            </RutaProtegida>
          }
        />

        <Route
          path="/cursos-disponibles"
          element={
            <RutaProtegida>
              <CursosDisponibles />
            </RutaProtegida>
          }
        />

        <Route
          path="/verificar-mis-cursos"
          element={
            <RutaProtegida rolRequerido="Formador">
              <VerificarMisCursos />
            </RutaProtegida>
          }
        />

        <Route
          path="/administrador"
          element={<Navigate to="/admin" replace />}
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
