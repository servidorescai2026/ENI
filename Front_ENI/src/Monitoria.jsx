import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as monitoriaService from "./services/Monitoria/monitoriaService";
import MonitoriaCard from "./components/Monitoria/MonitoriaCard";
import { apiUrl } from "./config/api";

export default function Monitoria() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [formadoresMonitoria, setFormadoresMonitoria] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("pendientes"); // todos, al-dia, pendiente-revision, pendientes
  const [exportandoReporte, setExportandoReporte] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);

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
      cargarNotificaciones();
    }
  }, [navigate]);

  const cargarNotificaciones = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl("/api/usuarios/mis-notificaciones"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotificaciones(data.notificaciones || []);
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    }
  };

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

  const marcarNotificacionComoLeida = async (notificacionId) => {
    try {
      const token = localStorage.getItem("token");
      console.log(`[MONITORIA-FE] Marcando notificación ${notificacionId} como leída`);
      
      const res = await fetch(
        apiUrl(`/api/usuarios/notificaciones/${notificacionId}/marcar-leida`),
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        console.error("Error al marcar notificación como leída");
        return;
      }

      console.log(`[MONITORIA-FE] Notificación ${notificacionId} marcada exitosamente`);

      // Actualizar notificaciones locales
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === notificacionId ? { ...n, leida: 1 } : n))
      );

      // Pequeño delay para asegurar que el backend procesó todo
      await new Promise(resolve => setTimeout(resolve, 500));

      // Recargar datos de monitoría para reflejar cambios
      console.log(`[MONITORIA-FE] Recargando datos de monitoría...`);
      await cargarDatos();
      console.log(`[MONITORIA-FE] Datos de monitoría recargados`);
    } catch (error) {
      console.error("Error al marcar notificación:", error);
    }
  };

  const marcarEvidenciasComLeidas = async (formadorId) => {
    // Buscar todas las notificaciones de este formador
    console.log(`[MONITORIA-FE] Buscando notificaciones del formador ${formadorId}`);
    const notificacionesFormador = notificaciones.filter((n) => {
      try {
        const payload = JSON.parse(n.archivos || "{}");
        const esDelFormador = payload.sourceUserId === formadorId && !n.leida;
        console.log(`[MONITORIA-FE] Notificación ${n.id}: sourceUserId=${payload.sourceUserId}, leida=${n.leida}, esDelFormador=${esDelFormador}`);
        return esDelFormador;
      } catch {
        return false;
      }
    });

    console.log(`[MONITORIA-FE] Se encontraron ${notificacionesFormador.length} notificaciones sin leer para el formador ${formadorId}`);

    // Marcar cada una como leída en secuencia
    for (const notif of notificacionesFormador) {
      await marcarNotificacionComoLeida(notif.id);
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
              <MonitoriaCard 
                key={formador.id} 
                formador={formador}
                onMarcarEvidenciasLeidas={() => marcarEvidenciasComLeidas(formador.id)}
              />
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
