import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function GestionUsuarios() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    rol: "Usuario",
    estado: "Activo"
  });


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

  useEffect(() => {
    const autenticado = verificarAutenticacion();
    if (autenticado) {
      setTimeout(() => {
        setUsuarios([]); // Aquí iría la llamada al backend para obtener usuarios
      }, 1000);
    }
  }, [verificarAutenticacion]);

  const filtrarUsuarios = usuarios.filter(usuarioItem =>
    usuarioItem.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    usuarioItem.email.toLowerCase().includes(filtro.toLowerCase()) ||
    usuarioItem.rol.toLowerCase().includes(filtro.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (usuarioEditando) {
      // Editar usuario existente
      setUsuarios(prev => prev.map(u => 
        u.id === usuarioEditando.id 
          ? { ...u, ...formData }
          : u
      ));
    } else {
      // Crear nuevo usuario
      const nuevoUsuario = {
        id: Date.now(),
        ...formData,
        fechaRegistro: new Date().toISOString().split('T')[0]
      };
      setUsuarios(prev => [...prev, nuevoUsuario]);
    }
    
    setMostrarFormulario(false);
    setUsuarioEditando(null);
    setFormData({
      nombre: "",
      email: "",
      rol: "Usuario",
      estado: "Activo"
    });
  };

  const editarUsuario = (usuarioItem) => {
    setUsuarioEditando(usuarioItem);
    setFormData({
      nombre: usuarioItem.nombre,
      email: usuarioItem.email,
      rol: usuarioItem.rol,
      estado: usuarioItem.estado
    });
    setMostrarFormulario(true);
  };

  const eliminarUsuario = (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      setUsuarios(prev => prev.filter(u => u.id !== id));
    }
  };

  const toggleEstado = (id) => {
    setUsuarios(prev => prev.map(u =>
      u.id === id 
        ? { ...u, estado: u.estado === "Activo" ? "Inactivo" : "Activo" }
        : u
    ));
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
              Gestión de Usuarios
              <span className="emoji-spin">👥</span>
            </h2>
          </div>

          <div className="header-buttons">
            <button 
              className="btn-anim" 
              onClick={() => setMostrarFormulario(true)}
              type="button"
            >
              <div className="btn-icon">
                <div className="icon-virtual"></div>
              </div>
              <span>Nuevo Usuario</span>
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
        <div className="gestion-content">
          {/* Barra de búsqueda y filtros */}
          <div className="filtros-container">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            
            <div className="filtros-stats">
              <span className="stat-badge">
                Total: {usuarios.length}
              </span>
              <span className="stat-badge activo">
                Activos: {usuarios.filter(u => u.estado === "Activo").length}
              </span>
              <span className="stat-badge inactivo">
                Inactivos: {usuarios.filter(u => u.estado === "Inactivo").length}
              </span>
            </div>
          </div>

          {/* Tabla de usuarios */}
          <div className="tabla-container">
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Fecha Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrarUsuarios.map(usuarioItem => (
                  <tr key={usuarioItem.id}>
                    <td>{usuarioItem.nombre}</td>
                    <td>{usuarioItem.email}</td>
                    <td>
                      <span className={`rol-badge ${usuarioItem.rol.toLowerCase()}`}>
                        {usuarioItem.rol}
                      </span>
                    </td>
                    <td>
                      <button 
                        className={`estado-btn ${usuarioItem.estado.toLowerCase()}`}
                        onClick={() => toggleEstado(usuarioItem.id)}
                        type="button"
                      >
                        {usuarioItem.estado}
                      </button>
                    </td>
                    <td>{usuarioItem.fechaRegistro}</td>
                    <td>
                      <div className="acciones-buttons">
                        <button 
                          className="btn-accion editar"
                          onClick={() => editarUsuario(usuarioItem)}
                          type="button"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-accion eliminar"
                          onClick={() => eliminarUsuario(usuarioItem.id)}
                          type="button"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal de formulario */}
      {mostrarFormulario && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setMostrarFormulario(false);
                  setUsuarioEditando(null);
                  setFormData({
                    nombre: "",
                    email: "",
                    rol: "Usuario",
                    estado: "Activo"
                  });
                }}
                type="button"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="usuario-form">
              <div className="form-group">
                <label htmlFor="nombre">Nombre:</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="rol">Rol:</label>
                <select
                  id="rol"
                  name="rol"
                  value={formData.rol}
                  onChange={handleInputChange}
                >
                  <option value="Usuario">Usuario</option>
                  <option value="Editor">Editor</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="estado">Estado:</label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
              
              <div className="form-buttons">
                <button type="submit" className="btn-anim">
                  {usuarioEditando ? 'Actualizar' : 'Crear'} Usuario
                </button>
                <button 
                  type="button" 
                  className="btn-anim btn-cerrar"
                  onClick={() => setMostrarFormulario(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="admin-footer">Panel ENI © 2025 - Gestión de Usuarios</footer>
    </div>
  );
  
}

