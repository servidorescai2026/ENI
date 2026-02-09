import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GetAllCourses from "./services/Cursos/GetAllCourses";
import GetCoursesByArea from "./services/Cursos/GetCoursesByArea";
import GetUserEnrollments from "./services/Inscripciones/GetUserEnrollments";

export default function Usuario() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const [misInscripciones, setMisInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);

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

          <button className="btn-notificaciones" onClick={irAMisNotificaciones}>
            Ver notificaciones
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
