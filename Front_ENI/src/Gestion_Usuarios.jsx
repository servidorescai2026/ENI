import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "./config/api";
import DeleteUsers from "./services/Usuarios/DeleteUsers";

export default function GestionUsuarios() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    rol: "Formador",
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
      cargarUsuarios();
    }
  }, [verificarAutenticacion]);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl("/api/usuarios"), {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Error al cargar usuarios");
      }
      
      const data = await response.json();
      // Normalizar respuesta (puede venir como array o en objeto)
      const usuariosArray = Array.isArray(data) ? data : (data.usuarios || []);
      setUsuarios(usuariosArray);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      alert("No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const filtrarUsuarios = usuarios
    .filter(usuarioItem => usuarioItem.rol === 'Formador' || usuarioItem.perfil === 'Formador')
    .filter(usuarioItem =>
      usuarioItem.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      usuarioItem.email.toLowerCase().includes(filtro.toLowerCase())
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
      rol: "Formador",
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

  const eliminarUsuario = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      try {
        await DeleteUsers(id);
        setUsuarios(prev => prev.filter(u => u.id !== id));
      } catch (error) {
        console.error("Error eliminando usuario:", error);
        alert("No se pudo eliminar el usuario en el servidor");
      }
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
              Gestión de Formadores
              <span className="emoji-spin">👨‍🏫</span>
            </h2>
          </div>

          <div className="header-buttons">

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
              className="btn-anim" 
              onClick={() => navigate('/upload-usuarios')}
              type="button"
            >
              <div className="btn-icon">
                <div className="icon-virtual"></div>
              </div>
              <span>Carga masiva</span>
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
                Total Formadores: {usuarios.filter(u => u.rol === 'Formador').length}
              </span>
              
            </div>
          </div>

          {/* Tabla de formadores */}
          <div className="tabla-container" style={{ 
            backgroundColor: '#1a3a52',
            borderRadius: '14px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden',
            marginTop: '2rem',
            border: '2px solid #2d5a7b'
          }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#b0c4de' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>⏳ Cargando formadores...</p>
              </div>
            ) : filtrarUsuarios.length === 0 ? (
              <div style={{ 
                padding: '3rem', 
                textAlign: 'center', 
                color: '#7a9fb5',
                backgroundColor: '#0f2437'
              }}>
                <p style={{ fontSize: '1.2rem', fontWeight: '500' }}>👨‍🏫 No hay formadores para mostrar</p>
              </div>
            ) : (
              <table className="usuarios-table" style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.95rem'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#2d5a7b',
                    color: '#e8f0f7',
                    fontWeight: '700',
                    textAlign: 'left',
                    borderBottom: '3px solid #4a7ba7'
                  }}>
                    <th style={{ padding: '1.3rem 1.5rem', color: '#a8d8ff' }}>👨‍🏫 Formador</th>
                    <th style={{ padding: '1.3rem 1.5rem', color: '#a8d8ff' }}>📧 Email</th>

                    <th style={{ padding: '1.3rem 1.5rem', color: '#a8d8ff', textAlign: 'center' }}>⚙️ Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrarUsuarios.map((usuarioItem, index) => (
                    <tr key={usuarioItem.id} style={{
                      backgroundColor: index % 2 === 0 ? '#1a3a52' : '#203d54',
                      borderBottom: '1px solid #2d5a7b',
                      transition: 'all 0.3s ease',
                      color: '#e8f0f7'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#314e68';
                      e.currentTarget.style.boxShadow = 'inset 0 0 10px rgba(100, 180, 255, 0.1)';
                      e.currentTarget.style.transform = 'scale(1.01)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#1a3a52' : '#203d54';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    >
                      <td style={{ padding: '1.2rem 1.5rem', color: '#a8d8ff', fontWeight: '600', fontSize: '0.98rem' }}>
                        {usuarioItem.nombre || usuarioItem.nombre}
                      </td>
                      <td style={{ padding: '1.2rem 1.5rem', color: '#b0c4de', fontSize: '0.9rem' }}>
                        {usuarioItem.email}
                      </td>
                      <td style={{ padding: '1.2rem 1.5rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.7rem', justifyContent: 'center' }}>
                          <button 
                            className="btn-accion editar"
                            onClick={() => editarUsuario(usuarioItem)}
                            type="button"
                            style={{
                              background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.6rem 1rem',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 6px rgba(74, 144, 226, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'linear-gradient(135deg, #357abd 0%, #2a5a8a 100%)';
                              e.target.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.5)';
                              e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)';
                              e.target.style.boxShadow = '0 2px 6px rgba(74, 144, 226, 0.3)';
                              e.target.style.transform = 'translateY(0)';
                            }}
                          >
                            ✏️ Editar
                          </button>
                          <button 
                            className="btn-accion eliminar"
                            onClick={() => eliminarUsuario(usuarioItem.id)}
                            type="button"
                            style={{
                              background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.6rem 1rem',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 6px rgba(231, 76, 60, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'linear-gradient(135deg, #c0392b 0%, #a02d23 100%)';
                              e.target.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.5)';
                              e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
                              e.target.style.boxShadow = '0 2px 6px rgba(231, 76, 60, 0.3)';
                              e.target.style.transform = 'translateY(0)';
                            }}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Modal de formulario */}
      {mostrarFormulario && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{usuarioEditando ? 'Editar Formador' : 'Nuevo Formador'}</h3>
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
                  {usuarioEditando ? 'Actualizar' : 'Crear'} Formador
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

      <footer className="admin-footer">Panel ENI © 2025 - Gestión de Formadores</footer>
    </div>
  );
  
}

