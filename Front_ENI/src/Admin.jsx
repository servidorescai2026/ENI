import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "./config/api";

// import
export default function Administrador() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);

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
        const noLeidas = (data.notificaciones || []).filter(n => !n.leida).length;
        setNotificacionesNoLeidas(noLeidas);
      } catch (error) {
        console.error("Error al cargar notificaciones:", error);
      }
    };

    cargarNotificacionesNoLeidas();
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarNotificacionesNoLeidas, 30000);
    return () => clearInterval(interval);
  }, []);

  // Función para formatear el contador
  const formatearContador = (cantidad) => {
    if (cantidad > 99) return "99+";
    return cantidad.toString();
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("requiereCambioPassword");
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

  // Función para navegar a Configuración
  const irAConfiguracion = () => {
    navigate("/configuracion");
  };

  // Función para navegar a Monitoría
  const irAMonitoria = () => {
    navigate("/monitoria");
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
            <button className="btn-anim btn-notificacion" onClick={() => navigate("/notificaciones")}>
              <div className="btn-icon">
                <div className="icon-presencial"></div>
              </div>
              <span>Enviar Notificación</span>
            </button>

            <button className="btn-anim btn-con-badge" onClick={() => navigate("/mis-notificaciones")}>
              <div className="btn-icon">
                <div className="icon-virtual"></div>
              </div>
              <span>Mis notificaciones</span>
              {notificacionesNoLeidas > 0 && (
                <span className="notification-badge">{formatearContador(notificacionesNoLeidas)}</span>
              )}
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

          {/* Botón de Configuración */}
          <button className="dashboard-card clickable-card" onClick={irAConfiguracion}>
            <div className="card-icon icon-virtual"></div>
            <h4>Configuración</h4>
            <p>Ajusta los parámetros del sistema</p>
            <div className="card-hover-indicator">→</div>
          </button>

          {/* Botón de Monitoría */}
          <button className="dashboard-card clickable-card" onClick={irAMonitoria}>
            <div className="card-icon icon-idiomas"></div>
            <h4>Monitoría</h4>
            <p>Revisa formadores sin evidencias</p>
            <div className="card-hover-indicator">→</div>
          </button>
        </div>
      </main>

      <footer className="admin-footer">Panel ENI © 2025</footer>
    </div>
  );
}
