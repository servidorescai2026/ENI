import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GetMyCourses from "./services/Cursos/GetMyCourses";

/**
 * Componente para que Formadores verifiquen sus cursos asignados
 * Solo muestra cursos del área a la que pertenece el formador
 */
export default function VerificarMisCursos() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const datosUsuario = JSON.parse(localStorage.getItem("usuario"));
    const token = localStorage.getItem("token");

    if (!token || !datosUsuario) {
      navigate("/login");
    } else if (datosUsuario.rol !== "Formador") {
      // Solo formadores pueden acceder a esta página
      navigate("/usuario");
    } else {
      setUsuario(datosUsuario);
      loadCursos();
    }
  }, [navigate]);

  const loadCursos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await GetMyCourses();
      setCursos(data || []);
    } catch (err) {
      console.error("Error cargando cursos:", err);
      setError(err.message || "Error al cargar los cursos");
    } finally {
      setLoading(false);
    }
  };

  if (!usuario) return <p>Cargando...</p>;

  return (
    <div className="verificar-cursos-container">
      <header className="verificar-cursos-header">
        <div className="header-buttons">
          <button
            className="btn-panel"
            onClick={() => navigate("/usuario")}
          >
            🏠 Panel de Usuario
          </button>
        </div>

        <div className="header-top">
          <div className="header-title-section">
            <h2>📚 Mis Cursos Asignados</h2>
            <p className="header-subtitle">
              Cursos del área: <strong>{usuario.areaId || "N/A"}</strong>
            </p>
          </div>
          <div className="header-buttons">
            <button
              className="btn-volver"
              onClick={() => navigate("/usuario")}
            >
              ← Volver a mi Panel
            </button>
            <button
              className="btn-recargar"
              onClick={loadCursos}
              disabled={loading}
            >
              🔄 Recargar
            </button>
          </div>
        </div>
      </header>

      <main className="verificar-cursos-main">
        {loading ? (
          <div className="loading-section">
            <p>Cargando tus cursos...</p>
          </div>
        ) : error ? (
          <div className="error-section">
            <p className="error-message">❌ {error}</p>
            <button className="btn-recargar-error" onClick={loadCursos}>
              Reintentar
            </button>
          </div>
        ) : cursos.length === 0 ? (
          <div className="empty-section">
            <p>No tienes cursos asignados en tu área.</p>
          </div>
        ) : (
          <div className="cursos-grid">
            {cursos.map((curso) => (
              <div key={curso.id} className="curso-card">
                <div className="curso-header">
                  <h3>{curso.nombre}</h3>
                  <span className="curso-nivel">{curso.nivel}</span>
                </div>

                <div className="curso-body">
                  <p className="curso-descripcion">{curso.descripcion}</p>

                  <div className="curso-info">
                    <div className="info-item">
                      <label>Categoría:</label>
                      <span>{curso.categoria}</span>
                    </div>
                    <div className="info-item">
                      <label>Duración:</label>
                      <span>{curso.duracion} horas</span>
                    </div>
                    <div className="info-item">
                      <label>Área ID:</label>
                      <span>{curso.areaId}</span>
                    </div>
                  </div>
                </div>

                <div className="curso-footer">
                  <span className="fecha-creacion">
                    Creado: {new Date(curso.created_at).toLocaleDateString("es-ES")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>


    </div>
  );
}
