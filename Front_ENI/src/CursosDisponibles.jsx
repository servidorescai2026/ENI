import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GetAllCourses from "./services/Cursos/GetAllCourses";
import GetCoursesByArea from "./services/Cursos/GetCoursesByArea";
import GetAllAreas from "./services/Areas/GetAllAreas";
import EnrollCourse from "./services/Inscripciones/EnrollCourse";
import GetUserEnrollments from "./services/Inscripciones/GetUserEnrollments";
import CancelEnrollment from "./services/Inscripciones/CancelEnrollment";

export default function CursosDisponibles() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [areasMap, setAreasMap] = useState({});
  const [enrolling, setEnrolling] = useState(null);
  const [canceling, setCanceling] = useState(null);

  useEffect(() => {
    const datosUsuario = JSON.parse(localStorage.getItem("usuario"));
    const token = localStorage.getItem("token");

    if (!token || !datosUsuario) {
      navigate("/login");
    } else {
      setUsuario(datosUsuario);
      // cargar cursos filtrados por area para usuarios normales, o todos para admin
      // cargar áreas primero (para mapear nombres) y luego cursos
      loadAreas().then(() => loadCursos(datosUsuario));
      loadUserEnrollments();
    }
  }, [navigate]);

  const loadAreas = async () => {
    try {
      const arr = await GetAllAreas();
      if (Array.isArray(arr)) {
        const map = {};
        arr.forEach((a) => {
          // normalizar posibles campos
          const id = String(a.id ?? a.codigo ?? a.codigoArea ?? a.areaId ?? a.area_id ?? '');
          const nombre = a.nombre ?? a.name ?? a.descripcion ?? a.nombreArea ?? '';
          if (id) map[id] = nombre || '';
        });
        setAreasMap(map);
      }
    } catch (err) {
      console.warn('No se pudieron cargar las áreas:', err);
    }
  };

  const loadCursos = async (usuarioParam) => {
    try {
      let data = [];
      const u = usuarioParam || usuario || JSON.parse(localStorage.getItem('usuario'));
      const isAdmin = (u && ((u.rol && u.rol.toLowerCase() === 'admin') || u.rol === 'Administrador'));

      if (isAdmin) {
        data = await GetAllCourses();
      } else if (u && u.areaId) {
        // Intentar endpoint por área; si falla, traer todos y luego filtrar localmente.
        try {
          data = await GetCoursesByArea(u.areaId);
        } catch (err) {
          console.warn('GetCoursesByArea falló, usando GetAllCourses como fallback:', err);
          data = await GetAllCourses();
          // Solo en el fallback con GetAllCourses filtramos por área en el cliente.
          if (Array.isArray(data)) {
            const areaStr = String(u.areaId);
            data = data.filter((c) => {
              return (
                String(c.areaId || '') === areaStr ||
                String(c.area_id || '') === areaStr ||
                String(c.area || '') === areaStr
              );
            });
          } else {
            data = [];
          }
        }
      } else {
        // fallback: intentar obtener todos
        data = await GetAllCourses();
      }
      setCursos(data);
    } catch (error) {
      console.error("Error cargando cursos:", error);
    }
  };

  const loadUserEnrollments = async () => {
    try {
      const data = await GetUserEnrollments();
      setInscripciones(data);
    } catch (error) {
      console.error("Error cargando inscripciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAreaName = (curso) => {
    // revisar varios nombres de campo posibles
    const id = String(curso.areaId ?? curso.area_id ?? curso.area ?? '');
    if (id && areasMap[id]) return areasMap[id];
    // si el curso ya incluye un nombre de área en otro campo
    return curso.areaNombre || curso.areaName || curso.nombreArea || 'Sin área';
  };

  const handleEnroll = async (courseId) => {
    const tieneInscripcionActiva = inscripciones.some(
      (inscripcion) => inscripcion.estado === "activo"
    );

    if (tieneInscripcionActiva) {
      alert("Ya tienes un curso activo. Solo puedes inscribirte a uno a la vez.");
      return;
    }

    setEnrolling(courseId);
    try {
      await EnrollCourse(courseId);
      alert("¡Te has inscrito exitosamente al curso!");
      await loadUserEnrollments(); // Recargar inscripciones
      await loadCursos(usuario); // Recargar cursos para actualizar contador
    } catch (error) {
      console.error("Error inscribiéndose al curso:", error);
      const mensaje = error.message || "Error al inscribirse al curso. Inténtalo de nuevo.";
      alert(mensaje);
    } finally {
      setEnrolling(null);
    }
  };

  const isEnrolled = (courseId) => {
    return inscripciones.some(
      (inscripcion) => inscripcion.curso_id === courseId && inscripcion.estado === "activo"
    );
  };

  const getEnrollmentByCourse = (courseId) => {
    return inscripciones.find((inscripcion) => inscripcion.curso_id === courseId);
  };

  const getActiveEnrollmentByCourse = (courseId) => {
    return inscripciones.find(
      (inscripcion) => inscripcion.curso_id === courseId && inscripcion.estado === "activo"
    );
  };

  const handleCancelEnrollment = async (enrollmentId) => {
    setCanceling(enrollmentId);
    try {
      await CancelEnrollment(enrollmentId);
      alert("Inscripción cancelada correctamente.");
      await loadUserEnrollments();
    } catch (error) {
      console.error("Error cancelando inscripción:", error);
      alert(error.message || "No se pudo cancelar la inscripción.");
    } finally {
      setCanceling(null);
    }
  };

  const tieneInscripcionActivaFormador =
    inscripciones.some((inscripcion) => inscripcion.estado === "activo");

  if (!usuario) return <p>Cargando...</p>;

  return (
    <div className="cursos-disponibles-container">
      <header className="cursos-disponibles-header">
        <div className="header-top">
          <h2>Cursos Disponibles - {usuario.nombre}</h2>
          <div className="header-buttons">
            <button
            className="btn-panel"
            onClick={() => navigate("/usuario")}>
            🏠 Panel de Usuario
          </button>
          </div>
        </div>
      </header>

      <main className="cursos-disponibles-main">
        <div className="welcome-section">
          <h3>Explora nuestros cursos disponibles 📚</h3>
          <p>Encuentra el curso perfecto para ti y comienza tu aprendizaje</p>
        </div>

        {loading ? (
          <p className="loading-text">Cargando cursos...</p>
        ) : cursos.length === 0 ? (
          <div className="no-cursos">
            <h4>No hay cursos disponibles</h4>
          </div>
        ) : (
          <div className="cursos-grid">
            {cursos.map((curso) => {
              const enrolled = isEnrolled(curso.id);
              const enrollment = getEnrollmentByCourse(curso.id);
              const activeEnrollment = getActiveEnrollmentByCourse(curso.id);
              const bloquearNuevaInscripcion = !enrolled && tieneInscripcionActivaFormador;
              const puedeReinscribirse = enrollment && enrollment.estado !== "activo";
              const inscripcionesCerradas = curso.inscripcionesAbiertas === false;
              const cupoLleno = curso.maxPersonas && curso.inscritosActivos >= curso.maxPersonas;
              const fechaPasada = curso.fechaCierreInscripcion && new Date(curso.fechaCierreInscripcion) < new Date();
              return (
                <div key={curso.id} className="curso-card">
                  <div className="curso-header">
                    <h4>{curso.nombre}</h4>
                    <span className={`nivel-badge nivel-${curso.nivel.toLowerCase()}`}>
                      {curso.nivel}
                    </span>
                  </div>

                  <div className="curso-body">
                    <p className="descripcion">{curso.descripcion}</p>
                    <div className="curso-info">
                      <span><strong>Categoría:</strong> {curso.categoria}</span>
                      <span><strong>Duración:</strong> {curso.duracion} horas</span>
                      <span><strong>Área:</strong> {getAreaName(curso)}</span>
                      {curso.maxPersonas && (
                        <span>
                          <strong>👥 Cupos:</strong> {curso.inscritosActivos || 0} / {curso.maxPersonas}
                          {cupoLleno && <span style={{color: 'red', marginLeft: '5px'}}>❗ Lleno</span>}
                        </span>
                      )}
                      {curso.fechaCierreInscripcion && (
                        <span>
                          <strong>📆 Cierre:</strong> {new Date(curso.fechaCierreInscripcion).toLocaleDateString('es-ES')}
                          {fechaPasada && <span style={{color: 'red', marginLeft: '5px'}}>❗ Cerrado</span>}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="curso-actions">
                    {enrolled ? (
                      <div className="enrolled-status">
                        <span className="enrolled-text">
                          {activeEnrollment ? "✓ Inscrito" : "Inscripción cancelada"}
                        </span>
                        {activeEnrollment && (
                          <button
                            className="btn-inscribirse"
                            onClick={() => handleCancelEnrollment(activeEnrollment.id)}
                            disabled={canceling === activeEnrollment.id}
                          >
                            {canceling === activeEnrollment.id ? "Cancelando..." : "Cancelar inscripción"}
                          </button>
                        )}
                      </div>
                    ) : puedeReinscribirse ? (
                      <button
                        className="btn-inscribirse"
                        onClick={() => handleEnroll(curso.id)}
                        disabled={Boolean(enrolling) || bloquearNuevaInscripcion || inscripcionesCerradas}
                      >
                        {Boolean(enrolling)
                          ? "Inscribiendo..."
                          : inscripcionesCerradas
                            ? (cupoLleno ? "Cupo lleno" : "Inscripciones cerradas")
                            : bloquearNuevaInscripcion
                              ? "Ya tienes un curso activo"
                              : "Volver a inscribirme"}
                      </button>
                    ) : (
                      <button
                        className="btn-inscribirse"
                        onClick={() => handleEnroll(curso.id)}
                        disabled={Boolean(enrolling) || bloquearNuevaInscripcion || inscripcionesCerradas}
                      >
                        {Boolean(enrolling)
                          ? "Inscribiendo..."
                          : inscripcionesCerradas
                            ? (cupoLleno ? "Cupo lleno" : "Inscripciones cerradas")
                            : bloquearNuevaInscripcion
                              ? "Ya tienes un curso activo"
                              : "Inscribirme"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sección de cursos inscritos */}
        {inscripciones.length > 0 && (
          <div className="mis-cursos-section">
            <h3>Mis Cursos Inscritos</h3>
            <div className="inscripciones-list">
              {inscripciones.map((inscripcion) => {
                const curso = cursos.find(c => c.id === inscripcion.curso_id);
                if (!curso) return null;

                return (
                  <div key={inscripcion.id} className="inscripcion-item">
                    <div className="inscripcion-info">
                      <h5>{curso.nombre}</h5>
                      <p>{curso.descripcion}</p>
                      <small>Inscrito el: {new Date(inscripcion.fecha_inscripcion).toLocaleDateString()}</small>
                    </div>
                    <div className="inscripcion-status">
                      <span className="status-active">
                        {inscripcion.estado === "activo" ? "Activo" : "Cancelado"}
                      </span>
                      {inscripcion.estado === "activo" && (
                        <button
                          className="btn-inscribirse"
                          onClick={() => handleCancelEnrollment(inscripcion.id)}
                          disabled={canceling === inscripcion.id}
                        >
                          {canceling === inscripcion.id ? "Cancelando..." : "Cancelar inscripción"}
                        </button>
                      )}
                      {inscripcion.estado !== "activo" && (
                        <button
                          className="btn-inscribirse"
                          onClick={() => handleEnroll(inscripcion.curso_id)}
                          disabled={Boolean(enrolling) || tieneInscripcionActivaFormador}
                        >
                          {Boolean(enrolling)
                            ? "Inscribiendo..."
                            : tieneInscripcionActivaFormador
                              ? "Ya tienes un curso activo"
                              : "Volver a inscribirme"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}