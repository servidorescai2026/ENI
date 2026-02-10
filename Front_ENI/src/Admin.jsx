import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// import
export default function Administrador() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const datosUsuario = JSON.parse(localStorage.getItem("usuario"));
    const token = localStorage.getItem("token");  
 
    if (!token || !datosUsuario) {
      navigate("/login");
    } else if (datosUsuario.rol !== "Administrador") {
      navigate("/usuario");
    } else {
      setUsuario(datosUsuario);
    }
  }, [navigate]);

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  // Función para navegar a Gestión de Usuarios
  const irAGestionUsuarios = () => {
    navigate("/gestion-usuarios");
  };

  // Función para navegar a Reportes
  const irAReportes = () => {
    navigate("/reportes");
  };

  // Función para navegar a Gestión de Cursos
  const irAGestionCursos = () => {
    navigate("/gestion-cursos");
  };

  if (!usuario) return <p>Cargando...</p>;

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="admin-top">
          <div className="admin-welcome">
            <h2 className="welcome-text">
              Bienvenido, {usuario.nombre} (Administrador)
<span className="emoji-bounce">🤖</span>

            </h2>
          </div>

          <button
  className="menu-toggle"
  onClick={() =>
    document.querySelector(".header-buttons")
      .classList.toggle("active")
  }
>
  ☰
</button>


          <div className="header-buttons">
            <button className="btn-anim" onClick={() => navigate("/register")}>
              <div className="btn-icon">
                <div className="icon-virtual"></div>
              </div>
              <span>Registrar nuevo usuario</span>
            </button>

            <button className="btn-anim btn-notificacion" onClick={() => navigate("/notificaciones")}>
              <div className="btn-icon">
                <div className="icon-presencial"></div>
              </div>
              <span>Enviar Notificación</span>
            </button>

            <button className="btn-anim" onClick={() => navigate("/mis-notificaciones")}>
              <div className="btn-icon">
                <div className="icon-virtual"></div>
              </div>
              <span>Mis notificaciones</span>
            </button>

            <button className="btn-anim btn-cerrar" onClick={cerrarSesion}>
              <div className="btn-icon">
                <div className="icon-idiomas"></div>
              </div>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <h3>Panel de Administración ⚙️</h3>
        <div className="dashboard-grid">
          {/* Botón de Gestión de Usuarios */}
          <button className="dashboard-card clickable-card" onClick={irAGestionUsuarios}>
            <div className="card-icon icon-empresarial"></div>
            <h4>Gestión de Usuarios</h4>
            <p>Administra los usuarios del sistema</p>
            <div className="card-hover-indicator">→</div>
          </button>

          {/* Botón de Gestión de Cursos */}
          <button className="dashboard-card clickable-card" onClick={irAGestionCursos}>
            <div className="card-icon icon-cursos"></div>
            <h4>Gestión de Cursos</h4>
            <p>Crea, edita y elimina cursos</p>
            <div className="card-hover-indicator">→</div>
          </button>

          <div className="dashboard-card">
            <div className="card-icon icon-virtual"></div>
            <h4>Configuración</h4>
            <p>Ajusta los parámetros del sistema</p>
          </div>

          {/* Botón de Reportes */}
          <button className="dashboard-card clickable-card" onClick={irAReportes}>
            <div className="card-icon icon-presencial"></div>
            <h4>Reportes</h4>
            <p>Genera reportes y estadísticas</p>
            <div className="card-hover-indicator">→</div>
          </button>

          <div className="dashboard-card">
            <div className="card-icon icon-idiomas"></div>
            <h4>Auditoría</h4>
            <p>Revisa los logs del sistema</p>
          </div>
        </div>
      </main>

      <footer className="admin-footer">Panel ENI © 2025</footer>
    </div>
  );
}