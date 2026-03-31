import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "./config/api";
import GetAllCourses from "./services/Cursos/GetAllCourses";
import GetCoursesByArea from "./services/Cursos/GetCoursesByArea";
import GetUserEnrollments from "./services/Inscripciones/GetUserEnrollments";

export default function Usuario() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const [misInscripciones, setMisInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [toastAprobacion, setToastAprobacion] = useState("");
  const toastTimeoutRef = useRef(null);

  const mostrarPopupAprobacion = (notificaciones = []) => {
    const usuarioData = JSON.parse(localStorage.getItem("usuario") || "{}");
    const usuarioId = usuarioData?.id;
    if (!usuarioId) return;

    const key = `lastApprovalPopupNotifId_${usuarioId}`;
    const lastShownId = Number(localStorage.getItem(key) || 0);

    const aprobaciones = notificaciones
      .filter((n) => !n.leida)
      .filter((n) => {
        const asunto = String(n.asunto || "").toLowerCase();
        const mensaje = String(n.mensaje || "").toLowerCase();
        return asunto.includes("evidencia aprobada") || (mensaje.includes("evidencia") && mensaje.includes("aprobada"));
      })
      .sort((a, b) => Number(a.id) - Number(b.id));

    const nuevas = aprobaciones.filter((n) => Number(n.id) > lastShownId);
    if (nuevas.length === 0) return;

    const ultima = nuevas[nuevas.length - 1];
    setToastAprobacion("Su evidencia a sido aprobada por el administrador");
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastAprobacion("");
      toastTimeoutRef.current = null;
    }, 4500);
    localStorage.setItem(key, String(ultima.id));
  };

  useEffect(() => {
    const datosUsuario = JSON.parse(localStorage.getItem("usuario"));
    const token = localStorage.getItem("token");

    if (!token || !datosUsuario) {
      navigate("/login");
    } else {
      setUsuario(datosUsuario);
      loadCursosData();
    }
  }, [navigate]);

  // Cargar contador de notificaciones no leídas
  useEffect(() => {
    const cargarNotificacionesNoLeidas = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      try {
        const res = await fetch(apiUrl("/api/usuarios/mis-notificaciones"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const notificaciones = data.notificaciones || [];
        const noLeidas = notificaciones.filter(n => !n.leida).length;
        setNotificacionesNoLeidas(noLeidas);
        mostrarPopupAprobacion(notificaciones);
      } catch (error) {
        console.error("Error al cargar notificaciones:", error);
      }
    };

    cargarNotificacionesNoLeidas();
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarNotificacionesNoLeidas, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Función para formatear el contador
  const formatearContador = (cantidad) => {
    if (cantidad > 99) return "99+";
    return cantidad.toString();
  };

  const loadCursosData = async () => {
    try {
      const datosUsuario = JSON.parse(localStorage.getItem("usuario"));
      let cursosData = [];
      
      if (datosUsuario?.rol === "Formador" && datosUsuario?.areaId) {
        try {
          cursosData = await GetCoursesByArea(datosUsuario.areaId);
        } catch (err) {
          console.warn("Error al obtener cursos por área:", err);
          cursosData = [];
        }
      } else {
        cursosData = await GetAllCourses();
      }
      
      const inscripcionesData = await GetUserEnrollments();
      setCursosDisponibles(Array.isArray(cursosData) ? cursosData.slice(0, 3) : []);
      setMisInscripciones(inscripcionesData);
    } catch (error) {
      console.error("Error cargando datos de cursos:", error);
    } finally {
      setLoading(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("requiereCambioPassword");
    navigate("/login");
  };

  const irACursosDisponibles = () => {
    navigate("/cursos-disponibles");
  };

  const irAMisNotificaciones = () => {
    navigate("/mis-notificaciones");
  };

  const irASubirEvidencias = () => {
    navigate("/subir-evidencias");
  };

  const irAVerificarMisCursos = () => {
    navigate("/verificar-mis-cursos");
  };

  if (!usuario) return <p>Cargando...</p>;

  return (
    <div className="usuario-container">
      {toastAprobacion && (
        <div className="toast-aprobacion-evidencia" role="status" aria-live="polite">
          <span className="toast-aprobacion-icon">✅</span>
          <span>{toastAprobacion}</span>
          <button
            type="button"
            className="toast-aprobacion-close"
            aria-label="Cerrar notificación"
            onClick={() => {
              setToastAprobacion("");
              if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
                toastTimeoutRef.current = null;
              }
            }}
          >
            ×
          </button>
        </div>
      )}
      <header className="usuario-header">
        <h2>Bienvenido, {usuario.nombre}, {usuario.rol} 🤖</h2>

        <div className="header-buttons">

          {/* ✅ NUEVO BOTÓN */}
          <button className="btn-cursos" onClick={irACursosDisponibles}>
            📚 Cursos disponibles
          </button>

          {usuario.rol === "Formador" && (
            <button className="btn-mis-cursos" onClick={irAVerificarMisCursos}>
              📋 Verificar mis cursos
            </button>
          )}

          <button className="btn-notificaciones btn-con-badge" onClick={irAMisNotificaciones}>
            Ver notificaciones
            {notificacionesNoLeidas > 0 && (
              <span className="notification-badge">{formatearContador(notificacionesNoLeidas)}</span>
            )}
          </button>

          <button className="btn-evidencias" onClick={irASubirEvidencias}>
            Subir evidencias
          </button>

          <button className="btn-cerrar" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="usuario-main">
        <div className="dashboard-section">

          <div className="dashboard-card">
            <h3>📚 Mis Cursos</h3>
            {loading ? (
              <p>Cargando...</p>
            ) : misInscripciones.length === 0 ? (
              <p>Aún no te has inscrito a ningún curso.</p>
            ) : (
              <div className="cursos-inscritos">
                <p>
                  Tienes <strong>{misInscripciones.length}</strong> curso
                  {misInscripciones.length !== 1 ? 's' : ''} activo
                  {misInscripciones.length !== 1 ? 's' : ''}
                </p>
                <button className="btn-ver-detalles" onClick={irACursosDisponibles}>
                  Ver detalles
                </button>
              </div>
            )}
          </div>

          <div className="dashboard-card">
            <h3>🎓 Cursos Disponibles</h3>
            {loading ? (
              <p>Cargando cursos...</p>
            ) : cursosDisponibles.length === 0 ? (
              <p>No hay cursos disponibles en este momento.</p>
            ) : (
              <div className="cursos-preview">
                <p>
                  Descubre <strong>{cursosDisponibles.length}</strong> curso
                  {cursosDisponibles.length !== 1 ? 's' : ''} disponible
                  {cursosDisponibles.length !== 1 ? 's' : ''}
                </p>

                <div className="cursos-list">
                  {cursosDisponibles.map((curso) => (
                    <div key={curso.id} className="curso-preview-item">
                      <span className="curso-nombre">{curso.nombre}</span>
                      <span className="curso-nivel">{curso.nivel}</span>
                    </div>
                  ))}
                </div>

                {/* ✅ botón también aquí */}
                <button className="btn-ver-todos" onClick={irACursosDisponibles}>
                  Ver todos los cursos
                </button>

              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
