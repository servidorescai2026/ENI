import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiUrl } from "./config/api";
import "./css/detalles-formador.css";
import { abbreviateAreaName } from "./utils/areaLabel";

export default function DetallesFormador() {
  const { formadorId } = useParams();
  const navigate = useNavigate();
  const [formador, setFormador] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [evidencias, setEvidencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const parseJsonSafe = async (res) => {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      throw new Error("Respuesta inválida del servidor. Verifica que el backend esté activo.");
    }
  };

  const normalizarLista = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.usuarios)) return payload.usuarios;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      cargarDatos();
    }
  }, [formadorId, navigate]);

  const cargarDatos = async () => {
    const token = localStorage.getItem("token");
    setCargando(true);
    setError(null);

    try {
      // Cargar lista de usuarios y obtener el formador por id
      const resUsuarios = await fetch(apiUrl("/api/usuarios"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataUsuarios = await parseJsonSafe(resUsuarios);
      if (!resUsuarios.ok) {
        throw new Error(dataUsuarios?.mensaje || "No se pudo cargar la lista de usuarios");
      }

      const usuarios = normalizarLista(dataUsuarios);
      const formadorEncontrado = usuarios.find(
        (u) => Number(u.id) === Number(formadorId)
      );

      if (!formadorEncontrado) {
        throw new Error("No se encontró el formador seleccionado");
      }

      setFormador(formadorEncontrado);

      // Cargar todos los cursos
      const resCursos = await fetch(apiUrl("/api/cursos"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataCursos = await parseJsonSafe(resCursos);
      if (!resCursos.ok) {
        throw new Error(dataCursos?.mensaje || "No se pudieron cargar los cursos");
      }

      const cursosList = normalizarLista(dataCursos);
      // Filtrar cursos del área del formador
      const cursosFormador = cursosList.filter(
        (c) => Number(c.areaId) === Number(formadorEncontrado.areaId)
      );
      setCursos(cursosFormador);

      // Cargar evidencias del formador
      const resEvidencias = await fetch(apiUrl("/api/archivos"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataEvidencias = await parseJsonSafe(resEvidencias);
      if (!resEvidencias.ok) {
        throw new Error(dataEvidencias?.message || "No se pudieron cargar las evidencias");
      }

      const evidenciasList = normalizarLista(dataEvidencias);
      const evidenciasFormador = evidenciasList.filter(
        (e) => Number(e.usuarioId) === Number(formadorId)
      );
      setEvidencias(evidenciasFormador);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setError(error.message);
    } finally {
      setCargando(false);
    }
  };

  const obtenerNombreArea = (areaId) => {
    const areas = {
      1: "Tecnología",
      2: "Recursos Humanos",
      3: "Finanzas",
      4: "Marketing",
      5: "Operaciones",
    };
    return abbreviateAreaName(areas[areaId] || `Área ${areaId}`);
  };

  const obtenerEstadoBadge = (estado) => {
    const estilos = {
      pendiente: { texto: "⏳ Pendiente", clase: "badge-pendiente" },
      aprobado: { texto: "✅ Aprobado", clase: "badge-aprobado" },
      rechazado: { texto: "❌ Rechazado", clase: "badge-rechazado" },
    };
    return estilos[estado] || { texto: estado, clase: "badge-default" };
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "No disponible";
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return "No disponible";
    return new Date(fecha).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (cargando) {
    return (
      <div className="detalles-container loading">
        <p>Cargando información del formador...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detalles-container error">
        <p>Error: {error}</p>
        <button onClick={() => navigate("/monitoria")} className="btn-volver">
          Volver a Monitoría
        </button>
      </div>
    );
  }

  if (!formador) {
    return (
      <div className="detalles-container not-found">
        <p>Formador no encontrado</p>
        <button onClick={() => navigate("/monitoria")} className="btn-volver">
          Volver a Monitoría
        </button>
      </div>
    );
  }

  return (
    <div className="detalles-container">
      <header className="detalles-header">
        <button className="btn-volver" onClick={() => navigate("/monitoria")}>
          ← Volver
        </button>
        <h1>Detalles del Formador</h1>
      </header>

      {/* Sección de Información General */}
      <section className="detalles-section info-formador">
        <div className="info-header">
          <div className="formador-avatar-grande">
            {formador.nombre?.charAt(0).toUpperCase()}
          </div>
          <div className="formador-info-main">
            <h2>{formador.nombre} {formador.apellido}</h2>
            <p className="formador-email">{formador.email}</p>
            <p className="formador-cedula">Cédula: {formador.cedula}</p>
          </div>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <span className="label">📍 Área</span>
            <span className="value">{obtenerNombreArea(formador.areaId)}</span>
          </div>
          <div className="info-card">
            <span className="label">📱 Teléfono</span>
            <span className="value">{formador.telefono || "No registrado"}</span>
          </div>
          <div className="info-card">
            <span className="label">🎓 Rol</span>
            <span className="value">{formador.rol}</span>
          </div>
          <div className="info-card">
            <span className="label">📅 Registro</span>
            <span className="value">{formatearFecha(formador.fechaRegistro)}</span>
          </div>
        </div>
      </section>

      {/* Sección de Cursos */}
      <section className="detalles-section cursos-section">
        <h3>📚 Cursos Asignados ({cursos.length})</h3>
        {cursos.length === 0 ? (
          <div className="empty-state">
            <p>No hay cursos asignados para este formador</p>
          </div>
        ) : (
          <div className="cursos-grid">
            {cursos.map((curso) => (
              <div key={curso.id} className="curso-card">
                <h4>{curso.nombre}</h4>
                <p className="curso-descripcion">{curso.descripcion}</p>
                <div className="curso-meta">
                  <span>👥 Participantes: {curso.participantes || 0}</span>
                  <span>📅 Duración: {curso.duracion || "N/A"} horas</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sección de Evidencias */}
      <section className="detalles-section evidencias-section">
        <h3>📎 Evidencias Cargadas ({evidencias.length})</h3>
        {evidencias.length === 0 ? (
          <div className="empty-state">
            <p>No hay evidencias cargadas</p>
          </div>
        ) : (
          <div className="evidencias-list">
            {evidencias.map((evidencia) => (
              <div key={evidencia.id} className="evidencia-item">
                <div className="evidencia-header">
                  <div className="evidencia-nombre">
                    <span className="icono">📄</span>
                    <div>
                      <p className="nombre">{evidencia.nombre || "Archivo sin nombre"}</p>
                      <p className="fecha">{formatearFecha(evidencia.fechaCarga)}</p>
                    </div>
                  </div>
                  <span className={`badge ${obtenerEstadoBadge(evidencia.estado).clase}`}>
                    {obtenerEstadoBadge(evidencia.estado).texto}
                  </span>
                </div>
                {evidencia.comentarios && (
                  <div className="evidencia-comentarios">
                    <p><strong>Comentario:</strong> {evidencia.comentarios}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Resumen Estadístico */}
      <section className="detalles-section resumen-stats">
        <h3>📊 Resumen de Estadísticas</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-number">{evidencias.length}</span>
            <span className="stat-label">Total de Evidencias</span>
          </div>
          <div className="stat-card aprobado">
            <span className="stat-number">{evidencias.filter(e => e.estado === "aprobado").length}</span>
            <span className="stat-label">Aprobadas</span>
          </div>
          <div className="stat-card pendiente">
            <span className="stat-number">{evidencias.filter(e => e.estado === "pendiente").length}</span>
            <span className="stat-label">Pendientes</span>
          </div>
          <div className="stat-card rechazado">
            <span className="stat-number">{evidencias.filter(e => e.estado === "rechazado").length}</span>
            <span className="stat-label">Rechazadas</span>
          </div>
        </div>
      </section>
    </div>
  );
}
