import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "./config/api";

export default function Monitoria() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [formadoresSinEvidencias, setFormadoresSinEvidencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("todos"); // todos, pendientes, con-evidencia

  const normalizarLista = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.usuarios)) return payload.usuarios;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

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
    const token = localStorage.getItem("token");
    setCargando(true);

    try {
      // Cargar todos los usuarios (formadores)
      const resUsuarios = await fetch(apiUrl("/api/usuarios"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataUsuarios = await resUsuarios.json();
      if (!resUsuarios.ok) {
        throw new Error(dataUsuarios?.mensaje || "No se pudieron cargar los usuarios");
      }

      // Cargar todos los cursos
      const resCursos = await fetch(apiUrl("/api/cursos"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataCursos = await resCursos.json();
      if (!resCursos.ok) {
        throw new Error(dataCursos?.mensaje || "No se pudieron cargar los cursos");
      }

      // Cargar todas las evidencias/archivos
      const resEvidencias = await fetch(apiUrl("/api/archivos"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataEvidencias = await resEvidencias.json();
      if (!resEvidencias.ok) {
        throw new Error(dataEvidencias?.message || "No se pudieron cargar las evidencias");
      }

      const usuariosList = normalizarLista(dataUsuarios);
      const cursosList = normalizarLista(dataCursos);
      const evidenciasList = normalizarLista(dataEvidencias);

      // Filtrar solo formadores
      const formadoresList = usuariosList.filter(u => u.rol === "Formador");

      // Procesar formadores sin evidencias
      procesarFormadoresSinEvidencias(formadoresList, cursosList, evidenciasList);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setFormadoresSinEvidencias([]);
    } finally {
      setCargando(false);
    }
  };

  const procesarFormadoresSinEvidencias = (formadoresList, cursosList, evidenciasList) => {
    const fechaActual = new Date();
    const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    
    const formadoresConProblemas = [];

    formadoresList.forEach(formador => {
      // Obtener cursos del formador (por área)
      const cursosFormador = cursosList.filter(c => c.areaId === formador.areaId);
      
      // Obtener evidencias del formador
      const evidenciasFormador = evidenciasList.filter(e => e.usuarioId === formador.id);
      
      // Verificar si tiene evidencias este mes
      const evidenciasEsteMes = evidenciasFormador.filter(e => {
        const fechaEvidencia = new Date(e.fechaCarga);
        return fechaEvidencia >= primerDiaMes;
      });

      // Determinar el estado del formador
      const tieneEvidenciasEsteMes = evidenciasEsteMes.length > 0;
      const tieneEvidenciasPendientes = evidenciasFormador.some(e => e.estado === 'pendiente');
      const tieneEvidenciasRechazadas = evidenciasFormador.some(e => e.estado === 'rechazado');

      // Calcular días sin subir evidencias
      let diasSinEvidencia = null;
      if (!tieneEvidenciasEsteMes) {
        diasSinEvidencia = Math.floor((fechaActual - primerDiaMes) / (1000 * 60 * 60 * 24));
      }

      formadoresConProblemas.push({
        ...formador,
        cursos: cursosFormador,
        totalEvidencias: evidenciasFormador.length,
        evidenciasEsteMes: evidenciasEsteMes.length,
        evidenciasPendientes: evidenciasFormador.filter(e => e.estado === 'pendiente').length,
        evidenciasAprobadas: evidenciasFormador.filter(e => e.estado === 'aprobado').length,
        evidenciasRechazadas: evidenciasFormador.filter(e => e.estado === 'rechazado').length,
        tieneEvidenciasEsteMes,
        tieneEvidenciasPendientes,
        tieneEvidenciasRechazadas,
        diasSinEvidencia,
        estado: tieneEvidenciasEsteMes ? 'al-dia' : 'pendiente'
      });
    });

    setFormadoresSinEvidencias(formadoresConProblemas);
  };

  const formadoresFiltrados = formadoresSinEvidencias.filter(f => {
    if (filtro === "todos") return true;
    if (filtro === "pendientes") return f.estado === 'pendiente' || f.tieneEvidenciasPendientes || f.tieneEvidenciasRechazadas;
    if (filtro === "al-dia") return f.estado === 'al-dia';
    if (filtro === "con-evidencia") return f.totalEvidencias > 0;
    return true;
  });

  const obtenerNombreArea = (areaId) => {
    const areas = {
      1: "Tecnología",
      2: "Recursos Humanos",
      3: "Finanzas",
      4: "Marketing",
      5: "Operaciones"
    };
    return areas[areaId] || `Área ${areaId}`;
  };

  if (!usuario) return <p>Cargando...</p>;

  return (
    <div className="monitoria-container">
      <header className="monitoria-header">
        <button className="btn-volver" onClick={() => navigate("/admin")}>
          ← Volver al Panel
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
          Todos ({formadoresSinEvidencias.length})
        </button>
        <button 
          className={`filtro-btn pendiente ${filtro === "pendientes" ? "activo" : ""}`}
          onClick={() => setFiltro("pendientes")}
        >
          ⚠️ Pendientes ({formadoresSinEvidencias.filter(f => f.estado === 'pendiente' || f.tieneEvidenciasPendientes).length})
        </button>
        <button 
          className={`filtro-btn ok ${filtro === "al-dia" ? "activo" : ""}`}
          onClick={() => setFiltro("al-dia")}
        >
          ✅ Al día ({formadoresSinEvidencias.filter(f => f.estado === 'al-dia').length})
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
              <div 
                key={formador.id} 
                className={`monitoria-card ${formador.estado === 'pendiente' ? 'card-pendiente' : 'card-ok'}`}
              >
                <div className="card-header">
                  <div className="formador-avatar">
                    {formador.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="formador-info">
                    <h3>{formador.nombre} {formador.apellido}</h3>
                    <p className="formador-email">{formador.email}</p>
                  </div>
                  <span className={`estado-badge ${formador.estado}`}>
                    {formador.estado === 'al-dia' ? '✅ Al día' : '⚠️ Pendiente'}
                  </span>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <span className="label">📍 Área:</span>
                    <span className="value">{obtenerNombreArea(formador.areaId)}</span>
                  </div>

                  <div className="info-row">
                    <span className="label">📚 Cursos asignados:</span>
                    <span className="value">{formador.cursos.length}</span>
                  </div>

                  <div className="info-row">
                    <span className="label">📎 Total evidencias:</span>
                    <span className="value">{formador.totalEvidencias}</span>
                  </div>

                  <div className="info-row">
                    <span className="label">📅 Evidencias este mes:</span>
                    <span className={`value ${formador.evidenciasEsteMes === 0 ? 'alerta' : ''}`}>
                      {formador.evidenciasEsteMes}
                    </span>
                  </div>

                  {formador.evidenciasPendientes > 0 && (
                    <div className="info-row pendiente">
                      <span className="label">⏳ Pendientes de revisión:</span>
                      <span className="value">{formador.evidenciasPendientes}</span>
                    </div>
                  )}

                  {formador.evidenciasRechazadas > 0 && (
                    <div className="info-row rechazado">
                      <span className="label">❌ Evidencias rechazadas:</span>
                      <span className="value">{formador.evidenciasRechazadas}</span>
                    </div>
                  )}

                  {formador.diasSinEvidencia !== null && (
                    <div className="info-row alerta">
                      <span className="label">⚠️ Días sin evidencia:</span>
                      <span className="value">{formador.diasSinEvidencia} días</span>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <button 
                    className="btn-detalle"
                    onClick={() => navigate(`/gestion-cursos`)}
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="monitoria-resumen">
        <h3>📈 Resumen General</h3>
        <div className="resumen-stats">
          <div className="stat-item">
            <span className="stat-number">{formadoresSinEvidencias.length}</span>
            <span className="stat-label">Total Formadores</span>
          </div>
          <div className="stat-item ok">
            <span className="stat-number">
              {formadoresSinEvidencias.filter(f => f.estado === 'al-dia').length}
            </span>
            <span className="stat-label">Al día</span>
          </div>
          <div className="stat-item pendiente">
            <span className="stat-number">
              {formadoresSinEvidencias.filter(f => f.estado === 'pendiente').length}
            </span>
            <span className="stat-label">Pendientes</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {formadoresSinEvidencias.reduce((acc, f) => acc + f.evidenciasPendientes, 0)}
            </span>
            <span className="stat-label">Evidencias por revisar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
