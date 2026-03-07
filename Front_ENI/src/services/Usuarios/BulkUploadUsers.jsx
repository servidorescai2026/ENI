import authFetch from "../../utils/authFetch";
import { apiUrl } from "../../config/api";

async function BulkUploadUsers(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await authFetch(apiUrl("/api/usuarios/upload-bulk"), {
    method: "POST",
    body: formData,
    // no application/json header for FormData
  });

  if (!response) {
    // authFetch already handled redirection if 401
    return;
  }

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.mensaje || "Error al importar archivo");
    error.detalles = data?.detalles || null;
    throw error;
  }

  return data;
}

export default BulkUploadUsers;
