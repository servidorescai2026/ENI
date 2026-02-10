import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GestionUsuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const usuariosPorPagina = 10;

  const API_URL = "http://127.0.0.1:3000/api/usuarios";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const cargarUsuarios = async () => {
      try {
        const response = await fetch(API_URL, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error al conectar con la API");
        }

        const datos = await response.json();
        console.log("Usuarios desde API:", datos);

        // 🔥 SOPORTA data[] o array directo
        const listaUsuarios = Array.isArray(datos)
          ? datos
          : datos.data || datos.usuarios || [];

        // 🔥 FILTRAR FORMADORES
        const formadores = listaUsuarios.filter(
          (u) => u.rol && u.rol.toLowerCase() === "formador"
        );

        setUsuarios(formadores);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarUsuarios();
  }, [navigate]);

  const usuariosFiltrados = usuarios.filter((u) =>
    `${u.nombre} ${u.apellido} ${u.email} ${u.areaId}`
      .toLowerCase()
      .includes(filtro.toLowerCase())
  );

  // Resetear página cuando cambia el filtro
  useEffect(() => {
    setPaginaActual(1);
  }, [filtro]);

  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);
  const usuariosPaginados = usuariosFiltrados.slice((paginaActual - 1) * usuariosPorPagina, paginaActual * usuariosPorPagina);

  if (loading) return <p>Cargando...⏳</p>;

  return (
    <div className="admin-container">
      <h2>Gestión de Usuarios 👥</h2>

      <button onClick={() => navigate("/admin")} className="btn-volver-panel">
        Volver al Panel
      </button>

      <input
        type="text"
        placeholder="Buscar...🕵️"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />

      <table className="usuarios-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Área</th>
          </tr>
        </thead>
        <tbody>
          {usuariosPaginados.length > 0 ? (
            usuariosPaginados.map((u) => (
              <tr key={u.id}>
                <td>{u.nombre} {u.apellido}</td>
                <td>{u.email}</td>
                <td>{u.rol}</td>
                <td>{u.areaId}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No hay formadores</td>
            </tr>
          )}
        </tbody>
      </table>

      {totalPaginas > 1 && (
        <div className="paginacion">
          <button
            onClick={() => setPaginaActual(paginaActual - 1)}
            disabled={paginaActual === 1}
            className="btn-paginacion"
          >
            Anterior
          </button>
          <span className="pagina-info">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            onClick={() => setPaginaActual(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
            className="btn-paginacion"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}