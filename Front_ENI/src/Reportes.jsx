import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";


export default function Reportes() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [reportes, setReportes] = useState([]);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState("todos");
  const [datosEstadisticas, setDatosEstadisticas] = useState({});

  // Datos de ejemplo para reportes
  const reportesEjemplo = [
    { 
      id: 1, 
      titulo: "Reporte de Actividad Mensual", 
      tipo: "Actividad", 
      fecha: "2024-12-01", 
      estado: "Completado",
      descargas: 45,
      datos: { usuariosNuevos: 15, actividades: 234, ingresos: 12500 }
    },
    { 
      id: 2, 
      titulo: "Análisis de Usuarios", 
      tipo: "Usuarios", 
      fecha: "2024-11-28", 
      estado: "Completado",
      descargas: 32,
      datos: { totalUsuarios: 156, activos: 142, inactivos: 14 }
    },
    { 
      id: 3, 
      titulo: "Reporte Financiero Q4", 
      tipo: "Financiero", 
      fecha: "2024-12-05", 
      estado: "Generando",
      descargas: 0,
      datos: { ingresos: 45000, gastos: 32000, ganancia: 13000 }
    },
    { 
      id: 4, 
      titulo: "Auditoría de Seguridad", 
      tipo: "Seguridad", 
      fecha: "2024-11-20", 
      estado: "Completado",
      descargas: 28,
      datos: { intentosFallidos: 12, accesosExitosos: 1245, alertas: 3 }
    }
  ];

  // Función de verificación de autenticación
  const verificarAutenticacion = useCallback(() => {
    const datosUsuario = JSON.parse(localStorage.getItem("usuario"));
    const token = localStorage.getItem("token");

    if (!token || !datosUsuario) {
      navigate("/login");
      return false;
    } else if (datosUsuario.rol !== "Administrador") {
      navigate("/usuario");
      return false;
    } else {
      setUsuario(datosUsuario);
      return true;
    }
  }, [navigate]);

  const calcularEstadisticas = useCallback((reportesData) => {
    const stats = {
      totalReportes: reportesData.length,
      completados: reportesData.filter(r => r.estado === "Completado").length,
      enProceso: reportesData.filter(r => r.estado === "Generando").length,
      totalDescargas: reportesData.reduce((sum, r) => sum + r.descargas, 0)
    };
    setDatosEstadisticas(stats);
  }, []);

  useEffect(() => {
    const autenticado = verificarAutenticacion();
    if (autenticado) {
      // Simular carga de reportes
      setTimeout(() => {
        setReportes(reportesEjemplo);
        calcularEstadisticas(reportesEjemplo);
      }, 1000);
    }
  }, [verificarAutenticacion, calcularEstadisticas]);

  const filtrarReportes = reportes.filter(reporte => {
    if (filtroFecha === "todos") return true;
    
    const fechaReporte = new Date(reporte.fecha);
    const hoy = new Date();
    const diferenciaDias = Math.floor((hoy - fechaReporte) / (1000 * 60 * 60 * 24));
    
    switch (filtroFecha) {
      case "7dias": return diferenciaDias <= 7;
      case "30dias": return diferenciaDias <= 30;
      case "90dias": return diferenciaDias <= 90;
      default: return true;
    }
  });

  const generarNuevoReporte = () => {
    const nuevoReporte = {
      id: Date.now(),
      titulo: `Reporte Automático ${new Date().toLocaleDateString()}`,
      tipo: "Automático",
      fecha: new Date().toISOString().split('T')[0],
      estado: "Generando",
      descargas: 0,
      datos: { metricas: "En proceso de generación..." }
    };
    
    setReportes(prev => [nuevoReporte, ...prev]);
    
    // Simular generación del reporte
    setTimeout(() => {
      setReportes(prev => prev.map(r => 
        r.id === nuevoReporte.id 
          ? { ...r, estado: "Completado", datos: { metricas: "Generado exitosamente" } }
          : r
      ));
      calcularEstadisticas(reportes);
    }, 3000);
  };

  const descargarReporte = (reporte) => {
    // Simular descarga
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(reporte, null, 2)], { type: 'application/json' }));
    link.download = `reporte-${reporte.titulo}.json`;
    link.click();
    
    // Actualizar contador de descargas
    setReportes(prev => prev.map(r =>
      r.id === reporte.id ? { ...r, descargas: r.descargas + 1 } : r
    ));
    calcularEstadisticas(reportes);
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  const volverAlPanel = () => {
    navigate("/administrador");
  };

  if (!usuario) return <p>Cargando...</p>;

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="admin-top">
          <div className="admin-welcome">
            <h2 className="welcome-text">
              Sistema de Reportes
              <span className="emoji-spin">📊</span>
            </h2>
          </div>

          <div className="header-buttons">
            <button 
              className="btn-anim" 
              onClick={generarNuevoReporte}
              type="button"
            >
              <div className="btn-icon">
                <div className="icon-virtual"></div>
              </div>
              <span>Generar Reporte</span>
            </button>

            <button 
              className="btn-anim btn-notificacion" 
              onClick={volverAlPanel}
              type="button"
            >
              <div className="btn-icon">
                <div className="icon-presencial"></div>
              </div>
              <span>Volver al Panel</span>
            </button>

            <button 
              className="btn-anim btn-cerrar" 
              onClick={cerrarSesion}
              type="button"
            >
              <div className="btn-icon">
                <div className="icon-idiomas"></div>
              </div>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="reportes-content">
          {/* Estadísticas rápidas */}
          <div className="estadisticas-grid">
            <div className="estadistica-card">
              <div className="estadistica-icon">📈</div>
              <div className="estadistica-info">
                <h3>{datosEstadisticas.totalReportes || 0}</h3>
                <p>Total Reportes</p>
              </div>
            </div>
            
            <div className="estadistica-card">
              <div className="estadistica-icon">✅</div>
              <div className="estadistica-info">
                <h3>{datosEstadisticas.completados || 0}</h3>
                <p>Completados</p>
              </div>
            </div>
            
            <div className="estadistica-card">
              <div className="estadistica-icon">⏳</div>
              <div className="estadistica-info">
                <h3>{datosEstadisticas.enProceso || 0}</h3>
                <p>En Proceso</p>
              </div>
            </div>
            
            <div className="estadistica-card">
              <div className="estadistica-icon">⬇️</div>
              <div className="estadistica-info">
                <h3>{datosEstadisticas.totalDescargas || 0}</h3>
                <p>Total Descargas</p>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="filtros-container">
            <div className="filtro-group">
              <label htmlFor="filtro-fecha">Filtrar por fecha:</label>
              <select 
                id="filtro-fecha"
                value={filtroFecha} 
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="filtro-select"
              >
                <option value="todos">Todos los reportes</option>
                <option value="7dias">Últimos 7 días</option>
                <option value="30dias">Últimos 30 días</option>
                <option value="90dias">Últimos 90 días</option>
              </select>
            </div>
          </div>

          {/* Lista de reportes */}
          <div className="reportes-grid">
            {filtrarReportes.map(reporte => (
              <div key={reporte.id} className="reporte-card">
                <div className="reporte-header">
                  <h4>{reporte.titulo}</h4>
                  <span className={`estado-badge ${reporte.estado.toLowerCase()}`}>
                    {reporte.estado}
                  </span>
                </div>
                
                <div className="reporte-info">
                  <p><strong>Tipo:</strong> {reporte.tipo}</p>
                  <p><strong>Fecha:</strong> {reporte.fecha}</p>
                  <p><strong>Descargas:</strong> {reporte.descargas}</p>
                </div>
                
                <div className="reporte-actions">
                  <button 
                    className="btn-accion ver"
                    onClick={() => setReporteSeleccionado(reporte)}
                    type="button"
                  >
                    👁️ Ver Detalles
                  </button>
                  <button 
                    className="btn-accion descargar"
                    onClick={() => descargarReporte(reporte)}
                    disabled={reporte.estado === "Generando"}
                    type="button"
                  >
                    ⬇️ Descargar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal de detalles del reporte */}
      {reporteSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Detalles del Reporte</h3>
              <button 
                className="close-btn"
                onClick={() => setReporteSeleccionado(null)}
                type="button"
              >
                ✕
              </button>
            </div>
            
            <div className="reporte-detalles">
              <h4>{reporteSeleccionado.titulo}</h4>
              
              <div className="detalles-grid">
                <div className="detalle-item">
                  <strong>Tipo:</strong> {reporteSeleccionado.tipo}
                </div>
                <div className="detalle-item">
                  <strong>Fecha:</strong> {reporteSeleccionado.fecha}
                </div>
                <div className="detalle-item">
                  <strong>Estado:</strong> 
                  <span className={`estado-badge ${reporteSeleccionado.estado.toLowerCase()}`}>
                    {reporteSeleccionado.estado}
                  </span>
                </div>
                <div className="detalle-item">
                  <strong>Descargas:</strong> {reporteSeleccionado.descargas}
                </div>
              </div>
              
              <div className="datos-reporte">
                <h5>Datos del Reporte:</h5>
                <pre className="datos-json">
                  {JSON.stringify(reporteSeleccionado.datos, null, 2)}
                </pre>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn-anim"
                  onClick={() => descargarReporte(reporteSeleccionado)}
                  type="button"
                >
                  Descargar Reporte
                </button>
                <button 
                  className="btn-anim btn-cerrar"
                  onClick={() => setReporteSeleccionado(null)}
                  type="button"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="admin-footer">Panel ENI © 2025 - Sistema de Reportes</footer>
    </div>
  );
}