import React, { useState } from "react";
import archivoService from "../services/Archivos/GetAllArchivos";

/**
 * Ejemplo de componente que usa el servicio de archivos
 * Este archivo muestra cómo usar cada función del servicio
 */
// /
export default function EjemploUsoArchivos() {
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ EJEMPLO 1: Obtener todos los archivos (Admin)
  const obtenerTodosArchivos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await archivoService.getAllArchivos();
      console.log("Todos los archivos:", response.data);
      setArchivos(response.data);
    } catch (err) {
      setError("Error al obtener archivos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ EJEMPLO 2: Obtener archivos de un usuario específico
  const obtenerArchivosPorUsuario = async (usuarioId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await archivoService.getArchivosByUsuario(usuarioId);
      console.log("Archivos del usuario:", response.data);
      setArchivos(response.data);
    } catch (err) {
      setError("Error al obtener archivos del usuario");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ EJEMPLO 3: Obtener un archivo específico
  const obtenerArchivoPorId = async (archivoId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await archivoService.getArchivoById(archivoId);
      console.log("Archivo obtenido:", response.data);
    } catch (err) {
      setError("Error al obtener el archivo");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ EJEMPLO 4: Actualizar estado de un archivo
  const aprobarArchivo = async (archivoId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await archivoService.updateArchivoEstado(
        archivoId,
        "aprobado",
        "Archivo aprobado correctamente"
      );
      console.log("Archivo actualizado:", response.data);
      // Actualizar la lista local
      setArchivos(
        archivos.map((a) =>
          a.id === archivoId ? { ...a, estado: "aprobado" } : a
        )
      );
    } catch (err) {
      setError("Error al actualizar archivo");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ EJEMPLO 5: Rechazar un archivo
  const rechazarArchivo = async (archivoId, razon) => {
    setLoading(true);
    setError(null);
    try {
      const response = await archivoService.updateArchivoEstado(
        archivoId,
        "rechazado",
        razon || "No cumple con los requisitos"
      );
      console.log("Archivo rechazado:", response.data);
      // Actualizar la lista local
      setArchivos(
        archivos.map((a) =>
          a.id === archivoId ? { ...a, estado: "rechazado" } : a
        )
      );
    } catch (err) {
      setError("Error al rechazar archivo");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ EJEMPLO 6: Eliminar un archivo
  const eliminarArchivo = async (archivoId) => {
    if (!window.confirm("¿Deseas eliminar este archivo?")) return;

    setLoading(true);
    setError(null);
    try {
      const response = await archivoService.deleteArchivo(archivoId);
      console.log("Archivo eliminado:", response.message);
      // Actualizar la lista local
      setArchivos(archivos.filter((a) => a.id !== archivoId));
    } catch (err) {
      setError("Error al eliminar archivo");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ EJEMPLO 7: Obtener estadísticas
  const obtenerEstadisticas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await archivoService.getArchivoStats();
      console.log("Estadísticas:", response.data);
      // Ejemplo: mostrar cuántos archivos hay en cada estado
      response.data.forEach((stat) => {
        console.log(`Estado "${stat.estado}": ${stat.cantidad} archivos`);
      });
    } catch (err) {
      setError("Error al obtener estadísticas");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>📚 Ejemplos de Uso del Servicio de Archivos</h1>

      {error && <p style={{ color: "red" }}>❌ {error}</p>}
      {loading && <p style={{ color: "blue" }}>⏳ Cargando...</p>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        <button onClick={obtenerTodosArchivos} style={buttonStyle}>
          📂 Obtener Todos los Archivos
        </button>

        <button
          onClick={() => obtenerArchivosPorUsuario(5)}
          style={buttonStyle}
        >
          👤 Obtener Archivos del Usuario 5
        </button>

        <button onClick={() => obtenerArchivoPorId(1)} style={buttonStyle}>
          🔍 Obtener Archivo con ID 1
        </button>

        <button onClick={() => aprobarArchivo(1)} style={buttonStyle}>
          ✅ Aprobar Archivo ID 1
        </button>

        <button
          onClick={() => rechazarArchivo(1, "No cumple requisitos")}
          style={buttonStyle}
        >
          ❌ Rechazar Archivo ID 1
        </button>

        <button onClick={() => eliminarArchivo(1)} style={buttonStyle}>
          🗑️ Eliminar Archivo ID 1
        </button>

        <button onClick={obtenerEstadisticas} style={buttonStyle}>
          📊 Obtener Estadísticas
        </button>
      </div>

      <h2>📋 Resultados:</h2>
      {archivos.length > 0 ? (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Estado</th>
              <th>Tipo</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {archivos.map((archivo) => (
              <tr key={archivo.id}>
                <td>{archivo.id}</td>
                <td>{archivo.nombre}</td>
                <td>{archivo.usuario?.nombre || "N/A"}</td>
                <td>
                  <span style={getEstadoStyle(archivo.estado)}>
                    {archivo.estado}
                  </span>
                </td>
                <td>{archivo.tipo}</td>
                <td>{new Date(archivo.fechaCarga).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No hay archivos cargados. Haz clic en uno de los botones para probar.</p>
      )}

      <h2>📖 Documentación de Funciones:</h2>
      <pre style={preStyle}>
{`
// 1. Obtener todos los archivos (Admin)
const response = await archivoService.getAllArchivos();

// 2. Obtener archivos de un usuario específico
const response = await archivoService.getArchivosByUsuario(usuarioId);

// 3. Obtener un archivo por ID
const response = await archivoService.getArchivoById(archivoId);

// 4. Actualizar estado de un archivo
const response = await archivoService.updateArchivoEstado(
  archivoId,
  "aprobado", // o "rechazado", "pendiente"
  "Descripción/comentario opcional"
);

// 5. Eliminar un archivo
const response = await archivoService.deleteArchivo(archivoId);

// 6. Obtener estadísticas
const response = await archivoService.getArchivoStats();
`}
      </pre>
    </div>
  );
}

// Estilos simples
const buttonStyle = {
  padding: "10px 15px",
  backgroundColor: "#667eea",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  transition: "background-color 0.3s",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "10px",
  border: "1px solid #ddd",
};

const preStyle = {
  backgroundColor: "#f4f4f4",
  padding: "15px",
  borderRadius: "5px",
  overflow: "auto",
  fontSize: "12px",
  border: "1px solid #ddd",
};

const getEstadoStyle = (estado) => {
  const styles = {
    pendiente: { color: "orange", fontWeight: "bold" },
    aprobado: { color: "green", fontWeight: "bold" },
    rechazado: { color: "red", fontWeight: "bold" },
  };
  return styles[estado] || {};
};
