import authFetch from "../../utils/authFetch";
import { apiUrl } from "../../config/api";

const API_URL = apiUrl("/api/archivos");

const request = async (path = "", options = {}) => {
  const response = await authFetch(`${API_URL}${path}`, options);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  return response.json();
};

// 📋 Obtener todos los archivos
export const getAllArchivos = async () => {
  try {
    return await request();
  } catch (error) {
    console.error("Error al obtener archivos:", error);
    throw error;
  }
};

// 📋 Obtener archivos de un usuario específico
export const getArchivosByUsuario = async (usuarioId) => {
  try {
    return await request(`/usuario/${usuarioId}`);
  } catch (error) {
    console.error("Error al obtener archivos del usuario:", error);
    throw error;
  }
};

// 📄 Obtener un archivo por ID
export const getArchivoById = async (archivoId) => {
  try {
    return await request(`/${archivoId}`);
  } catch (error) {
    console.error("Error al obtener archivo:", error);
    throw error;
  }
};

// ✏️ Actualizar estado de un archivo
export const updateArchivoEstado = async (archivoId, nuevoEstado, descripcion = "") => {
  try {
    return await request(`/${archivoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        estado: nuevoEstado,
        descripcion,
      }),
    });
  } catch (error) {
    console.error("Error al actualizar archivo:", error);
    throw error;
  }
};

// 🗑️ Eliminar un archivo
export const deleteArchivo = async (archivoId) => {
  try {
    return await request(`/${archivoId}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error al eliminar archivo:", error);
    throw error;
  }
};

// 📊 Obtener estadísticas de archivos
export const getArchivoStats = async () => {
  try {
    return await request("/stats/resumen");
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    throw error;
  }
};

// 📤 Crear un nuevo archivo (con datos de prueba)
export const createArchivo = async (formData) => {
  try {
    return await request("", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });
  } catch (error) {
    console.error("Error al crear archivo:", error);
    throw error;
  }
};


export default {
  getAllArchivos,
  getArchivosByUsuario,
  getArchivoById,
  updateArchivoEstado,
  deleteArchivo,
  getArchivoStats,
  createArchivo,
};
