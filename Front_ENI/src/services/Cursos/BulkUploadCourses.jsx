import authFetch from "../../utils/authFetch";
import { apiUrl } from "../../config/api";

async function BulkUploadCourses(file, options = {}) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("notifyUsers", String(Boolean(options.notifyUsers)));
  formData.append("notificationMessage", options.notificationMessage || "");

  const response = await authFetch(apiUrl("/api/cursos/upload-bulk"), {
    method: "POST",
    body: formData,
  });

  if (!response) {
    return;
  }

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.mensaje || data?.error || "Error al importar cursos");
    error.detalles = data?.detalles || null;
    throw error;
  }

  return data;
}

export default BulkUploadCourses;
