import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as monitoriaService from "./services/Monitoria/monitoriaService";
import MonitoriaCard from "./components/Monitoria/MonitoriaCard";

export default function Monitoria() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [formadoresMonitoria, setFormadoresMonitoria] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("pendientes"); // todos, al-dia, pendiente-revision, pendientes
  const [exportandoReporte, setExportandoReporte] = useState(false);

  useEffect(() => {
    const datosUsuario = JSON.parse(localStorage.getItem("usuario"));
    const token = localStorage.getItem("token");

    if (!token || !datosUsuario) {
      navigate("/login");
    } else if (datosUsuario.rol !== "Administrador") {
      navigate("/usuario");
    } else {
      setUsuario(datosUsuario);
      cargarDatos();
    }
  }, [navigate]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const data = await monitoriaService.getMonitoriaData();
      setFormadoresMonitoria(data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      alert("No se pudieron cargar los datos de monitoría");
    } finally {
      setCargando(false);
    }
  };

  const descargarReporte = async () => {
    try {
      setExportandoReporte(true);
      await monitoriaService.downloadMonitoriaExcel();
    } catch (error) {
      console.error("Error al descargar reporte:", error);
      alert(error.message);
    } finally {
      setExportandoReporte(false);
    }
  };

  const formadoresFiltrados = formadoresMonitoria.filter(f => {
    if (filtro === "todos") return true;
    if (filtro === "pendientes") return f.estado === 'pendiente';
    if (filtro === "al-dia") return f.estado === 'al-dia';
    if (filtro === "pendiente-revision") return f.estado === 'pendiente-revision';
    return true;
  });

  if (!usuario) return <p>Cargando...</p>;

  return (
    <div className="monitoria-container">
      <header className="monitoria-header">
        <button className="btn-panel" onClick={() => navigate("/admin")}>
          🏠 Panel de Usuario
        </button>
        <h2>📊 Monitoría de Formadores</h2>
        <p className="monitoria-subtitle">
          Seguimiento de evidencias y cumplimiento de formadores
        </p>
      </header>

      <div className="monitoria-filtros">
        <button
          className={`filtro-btn ${filtro === "todos" ? "activo" : ""}`}
          onClick={() => setFiltro("todos")}
        >
          📋 Todos ({formadoresMonitoria.length})
        </button>
        <button
          className={`filtro-btn ok ${filtro === "al-dia" ? "activo" : ""}`}
          onClick={() => setFiltro("al-dia")}
        >
          ✅ Al día ({formadoresMonitoria.filter(f => f.estado === 'al-dia').length})
        </button>
        <button
          className={`filtro-btn revision ${filtro === "pendiente-revision" ? "activo" : ""}`}
          onClick={() => setFiltro("pendiente-revision")}
        >
          🔍 En revisión ({formadoresMonitoria.filter(f => f.estado === 'pendiente-revision').length})
        </button>
        <button
          className={`filtro-btn pendiente ${filtro === "pendientes" ? "activo" : ""}`}
          onClick={() => setFiltro("pendientes")}
        >
          ⚠️ Pendientes reales ({formadoresMonitoria.filter(f => f.estado === 'pendiente').length})
        </button>
        <button
          className="filtro-btn ok"
          onClick={descargarReporte}
          disabled={exportandoReporte || cargando}
          style={{ marginLeft: "auto" }}
        >
          {exportandoReporte ? "Generando reporte..." : "📥 Descargar reporte"}
        </button>
      </div>

      <main className="monitoria-main">
        {cargando ? (
          <div className="monitoria-loading">
            <p>Cargando información de formadores...</p>
          </div>
        ) : formadoresFiltrados.length === 0 ? (
          <div className="monitoria-empty">
            <p>No hay formadores que coincidan con el filtro seleccionado</p>
          </div>
        ) : (
          <div className="monitoria-grid">
            {formadoresFiltrados.map((formador) => (
              <MonitoriaCard key={formador.id} formador={formador} />
            ))}
          </div>
        )}
      </main>

      <div className="monitoria-resumen">
        <h3>📈 Resumen General</h3>
        <div className="resumen-stats">
          <div className="stat-item">
            <span className="stat-number">{formadoresMonitoria.length}</span>
            <span className="stat-label">Total Formadores</span>
          </div>
          <div className="stat-item pendiente">
            <span className="stat-number">
              {formadoresMonitoria.filter(f => f.estado === 'pendiente').length}
            </span>
            <span className="stat-label">Pendientes</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {formadoresMonitoria.reduce((acc, f) => acc + f.evidenciasPendientes, 0)}
            </span>
            <span className="stat-label">Evidencias por revisar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
