import authFetch from "../../utils/authFetch";
import { apiUrl } from "../../config/api";

/**
 * Obtiene los datos procesados de monitoría desde el backend.
 */
export const getMonitoriaData = async () => {
    const response = await authFetch(apiUrl("/api/cursos/monitoria/data"));
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || "Error al cargar los datos de monitoría");
    }
    return await response.json();
};

/**
 * Descarga el reporte de monitoría en formato Excel.
 */
export const downloadMonitoriaExcel = async () => {
    const response = await authFetch(apiUrl("/api/cursos/monitoria/reporte-excel"));
    if (!response.ok) {
        throw new Error("No se pudo generar el reporte de Excel");
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte_monitoria_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};
