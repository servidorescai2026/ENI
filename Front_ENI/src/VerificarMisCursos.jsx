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

      <style jsx>{`
        .verificar-cursos-container {
          padding: 20px;
          background-color: #f8f9fa;
          min-height: 100vh;
        }
          

        .verificar-cursos-header {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .header-title-section h2 {
          margin: 0;
          color: #333;
          font-size: 24px;
        }

        .header-subtitle {
          margin: 5px 0 0 0;
          color: #666;
          font-size: 14px;
        }

        .header-buttons {
          display: flex;
          gap: 10px;
        }

        .btn-volver,
        .btn-recargar,
        .btn-recargar-error {
          padding: 10px 15px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .btn-volver {
          background-color: #6c757d;
          color: white;
        }

        .btn-volver:hover {
          background-color: #5a6268;
        }

        .btn-recargar,
        .btn-recargar-error {
          background-color: #007bff;
          color: white;
        }

        .btn-recargar:hover:not(:disabled),
        .btn-recargar-error:hover {
          background-color: #0056b3;
        }

        .btn-recargar:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .verificar-cursos-main {
          padding: 20px 0;
        }

        .loading-section,
        .empty-section,
        .error-section {
          background: white;
          padding: 40px 20px;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .error-message {
          color: #dc3545;
          margin-bottom: 20px;
        }

        .cursos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .curso-card {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .curso-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .curso-header {
          padding: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 10px;
        }

        .curso-header h3 {
          margin: 0;
          font-size: 18px;
          flex: 1;
        }

        .curso-nivel {
          background: rgba(255, 255, 255, 0.3);
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 12px;
          white-space: nowrap;
        }

        .curso-body {
          padding: 15px;
          flex: 1;
        }

        .curso-descripcion {
          margin: 0 0 15px 0;
          color: #666;
          font-size: 14px;
          line-height: 1.5;
        }

        .curso-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .info-item label {
          font-weight: bold;
          font-size: 12px;
          color: #666;
        }

        .info-item span {
          font-size: 14px;
          color: #333;
        }

        .curso-footer {
          padding: 10px 15px;
          background-color: #f8f9fa;
          border-top: 1px solid #e9ecef;
        }

        .fecha-creacion {
          font-size: 12px;
          color: #999;
        }

        @media (max-width: 768px) {
          .header-top {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-buttons {
            width: 100%;
            flex-wrap: wrap;
            <div className="header-buttons">
  <button 
    className="btn-panel" 
    onClick={() => navigate("/usuario")}
  >
    🏠 Panel de Usuario
  </button>

  <button 
    className="btn-recargar" 
    onClick={loadCursos}
    disabled={loading}
  >
    🔄 Recargar
  </button>
</div>

          }

          .cursos-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
