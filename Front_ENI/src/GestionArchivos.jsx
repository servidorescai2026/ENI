import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GestionArchivos() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [archivos, setArchivos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  useEffect(() => {
    const datosUsuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setUsuario(datosUsuario);
    obtenerArchivos(datosUsuario.id, token);
  }, [navigate]);

  const obtenerArchivos = async (usuarioId, token) => {
    try {
      setCargando(true);
      const endpoint =
        usuario?.rol === "Administrador"
          ? "http://localhost:3000/api/archivos"
          : `http://localhost:3000/api/archivos/usuario/${usuarioId}`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setArchivos(data.data || []);
      } else {
        console.error("Error al obtener archivos:", data.message);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCargando(false);
    }
  };

  const actualizarEstado = async (archivoId, nuevoEstado) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:3000/api/archivos/${archivoId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            estado: nuevoEstado,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Actualizar la lista de archivos
        setArchivos(
          archivos.map((a) =>
            a.id === archivoId ? { ...a, estado: nuevoEstado } : a
          )
        );
        alert("Estado actualizado correctamente");
      } else {
        alert("Error al actualizar: " + data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar el estado");
    }
  };

  const eliminarArchivo = async (archivoId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este archivo?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:3000/api/archivos/${archivoId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setArchivos(archivos.filter((a) => a.id !== archivoId));
        alert("Archivo eliminado correctamente");
      } else {
        alert("Error al eliminar: " + data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar el archivo");
    }
  };

  const archivosFiltrados =
    filtroEstado === "todos"
      ? archivos
      : archivos.filter((a) => a.estado === filtroEstado);

  const getEstadoBadge = (estado) => {
    const estilos = {
      pendiente: "badge-warning",
      aprobado: "badge-success",
      rechazado: "badge-danger",
    };
    return estilos[estado] || "badge-secondary";
  };

  if (!usuario) return <p>Cargando...</p>;

  return (
    <div className="gestion-archivos-container">
      <header className="admin-header">
        <h1>📁 Gestión de Archivos</h1>
        <button
          className="btn-anim btn-cerrar"
          onClick={() => navigate("/administrador")}
        >
          Volver al panel
        </button>
      </header>

      <div className="filtros-section">
        <h3>Filtrar por estado:</h3>
        <div className="filtros-botones">
          <button
            className={`btn ${filtroEstado === "todos" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFiltroEstado("todos")}
          >
            Todos
          </button>
          <button
            className={`btn ${filtroEstado === "pendiente" ? "btn-warning" : "btn-outline"}`}
            onClick={() => setFiltroEstado("pendiente")}
          >
            Pendientes
          </button>
          <button
            className={`btn ${filtroEstado === "aprobado" ? "btn-success" : "btn-outline"}`}
            onClick={() => setFiltroEstado("aprobado")}
          >
            Aprobados
          </button>
          <button
            className={`btn ${filtroEstado === "rechazado" ? "btn-danger" : "btn-outline"}`}
            onClick={() => setFiltroEstado("rechazado")}
          >
            Rechazados
          </button>
        </div>
      </div>

      {cargando ? (
        <p className="loading">Cargando archivos...</p>
      ) : archivosFiltrados.length === 0 ? (
        <p className="no-files">No hay archivos para mostrar</p>
      ) : (
        <table className="archivos-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Tipo</th>
              <th>Tamaño</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {archivosFiltrados.map((archivo) => (
              <tr key={archivo.id}>
                <td>{archivo.id}</td>
                <td>{archivo.nombre}</td>
                <td>{archivo.usuario?.nombre || "N/A"}</td>
                <td>{archivo.tipo}</td>
                <td>{(archivo.tamaño / 1024).toFixed(2)} KB</td>
                <td>
                  <span className={`badge ${getEstadoBadge(archivo.estado)}`}>
                    {archivo.estado}
                  </span>
                </td>
                <td>{new Date(archivo.fechaCarga).toLocaleDateString()}</td>
                <td className="acciones">
                  {usuario.rol === "Administrador" && (
                    <>
                      <select
                        defaultValue={archivo.estado}
                        onChange={(e) =>
                          actualizarEstado(archivo.id, e.target.value)
                        }
                        className="estado-select"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="rechazado">Rechazado</option>
                      </select>
                      <button
                        className="btn-anim btn-danger"
                        onClick={() => eliminarArchivo(archivo.id)}
                      >
                        🗑️ Eliminar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <style jsx>{`
        .gestion-archivos-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          color: white;
        }

        .filtros-section {
          margin-bottom: 30px;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .filtros-botones {
          display: flex;
          gap: 10px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: #667eea;
          color: white;
        }

        .btn-success {
          background: #48bb78;
          color: white;
        }

        .btn-warning {
          background: #f6ad55;
          color: white;
        }

        .btn-danger {
          background: #f56565;
          color: white;
          padding: 4px 8px;
          font-size: 0.8rem;
        }

        .btn-outline {
          background: white;
          color: #333;
          border: 2px solid #ddd;
        }

        .btn-cerrar {
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid white;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 600;
        }

        .archivos-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .archivos-table thead {
          background: #333;
          color: white;
        }

        .archivos-table th {
          padding: 15px;
          text-align: left;
          font-weight: 600;
        }

        .archivos-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #eee;
        }

        .archivos-table tbody tr:hover {
          background: #f9f9f9;
        }

        .badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          color: white;
        }

        .badge-warning {
          background: #f6ad55;
        }

        .badge-success {
          background: #48bb78;
        }

        .badge-danger {
          background: #f56565;
        }

        .badge-secondary {
          background: #718096;
        }

        .estado-select {
          padding: 5px;
          border-radius: 4px;
          border: 1px solid #ddd;
          cursor: pointer;
        }

        .acciones {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }

        .loading,
        .no-files {
          text-align: center;
          padding: 30px;
          font-size: 1.1rem;
          color: #666;
        }
      `}</style>
    </div>
  );
}
