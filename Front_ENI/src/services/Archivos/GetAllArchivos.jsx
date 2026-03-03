import axios from "axios";

const API_URL = "http://localhost:3000/api/archivos";

// Obtener token del localStorage
const getToken = () => localStorage.getItem("token");

// Crear instancia de axios con autenticación
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar token en cada solicitud
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 📋 Obtener todos los archivos
export const getAllArchivos = async () => {
  try {
    const response = await axiosInstance.get("/");
    return response.data;
  } catch (error) {
    console.error("Error al obtener archivos:", error);
    throw error;
  }
};

// 📋 Obtener archivos de un usuario específico
export const getArchivosByUsuario = async (usuarioId) => {
  try {
    const response = await axiosInstance.get(`/usuario/${usuarioId}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener archivos del usuario:", error);
    throw error;
  }
};

// 📄 Obtener un archivo por ID
export const getArchivoById = async (archivoId) => {
  try {
    const response = await axiosInstance.get(`/${archivoId}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener archivo:", error);
    throw error;
  }
};

// ✏️ Actualizar estado de un archivo
export const updateArchivoEstado = async (archivoId, nuevoEstado, descripcion = "") => {
  try {
    const response = await axiosInstance.put(`/${archivoId}`, {
      estado: nuevoEstado,
      descripcion,
    });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar archivo:", error);
    throw error;
  }
};

// 🗑️ Eliminar un archivo
export const deleteArchivo = async (archivoId) => {
  try {
    const response = await axiosInstance.delete(`/${archivoId}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar archivo:", error);
    throw error;
  }
};

// 📊 Obtener estadísticas de archivos
export const getArchivoStats = async () => {
  try {
    const response = await axiosInstance.get("/stats/resumen");
    return response.data;
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    throw error;
  }
};

// 📤 Crear un nuevo archivo (con datos de prueba)
export const createArchivo = async (formData) => {
  try {
    const response = await axiosInstance.post("/subir", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
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
