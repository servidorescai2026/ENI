import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BulkUploadCoursesService from "./services/Cursos/BulkUploadCourses";

export default function BulkUploadCourses() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [notifyUsers, setNotifyUsers] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0] || null);
    setMessage("");
    setDetails(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setMessage("Selecciona un archivo primero");
      return;
    }

    if (notifyUsers) {
      const confirmed = window.confirm(
        "Se enviarán notificaciones a los usuarios vinculados por red de conocimiento. ¿Deseas continuar?"
      );
      if (!confirmed) {
        return;
      }
    }

    setLoading(true);
    try {
      const result = await BulkUploadCoursesService(selectedFile, {
        notifyUsers,
        notificationMessage,
      });

      if (result) {
        setMessage(result.mensaje || "Importación completada");
        setDetails(result.detalles || null);
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al enviar archivo");
      setDetails(error.detalles || null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="admin-top">
          <div className="admin-welcome">
            <h2 className="welcome-text">Carga masiva de cursos</h2>
            <p style={{ marginTop: "0.5rem", opacity: 0.85 }}>
              Importa cursos desde Excel, asigna usuarios por red de conocimiento y valida evidencia.
            </p>
          </div>
          <div className="header-buttons">
            <button className="btn-anim btn-notificacion" onClick={() => navigate("/gestion-cursos")} type="button">
              ← Volver a Gestión
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <form onSubmit={handleSubmit} className="bulk-form" style={{ maxWidth: "760px", margin: "2rem auto" }}>
          <div className="form-group">
            <label htmlFor="file">Archivo (.xlsx, .xls, .csv):</label>
            <input type="file" id="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
          </div>

          <div className="form-group" style={{ marginTop: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={notifyUsers}
                onChange={(event) => setNotifyUsers(event.target.checked)}
              />
              Notificar a los usuarios vinculados a los cursos importados
            </label>
          </div>

          <div className="form-group" style={{ marginTop: "1rem" }}>
            <label htmlFor="notificationMessage">Mensaje de notificación:</label>
            <textarea
              id="notificationMessage"
              rows="4"
              value={notificationMessage}
              onChange={(event) => setNotificationMessage(event.target.value)}
              placeholder="Escribe el mensaje opcional que recibirán los usuarios..."
              style={{ width: "100%", minHeight: "120px", padding: "0.85rem", borderRadius: "12px", border: "1px solid #d0d7de" }}
            />
          </div>

          <button type="submit" className="btn-anim" disabled={loading} style={{ marginTop: "1rem" }}>
            {loading ? "Importando..." : "Subir cursos"}
          </button>
        </form>

        {message && <p className="form-message">{message}</p>}

        {details && (
          <div className="bulk-details" style={{ maxWidth: "980px", margin: "1rem auto", textAlign: "left" }}>
            <p><strong>Cursos creados:</strong> {details.cursosCreados || 0}</p>
            <p><strong>Cursos actualizados:</strong> {details.cursosActualizados || 0}</p>
            <p><strong>Usuarios vinculados:</strong> {details.usuariosVinculados || 0}</p>
            <p><strong>Notificaciones enviadas:</strong> {details.notificacionesEnviadas || 0}</p>
            <p><strong>Filas omitidas:</strong> {details.filasOmitidas || 0}</p>

            {Array.isArray(details.encabezadosDetectados) && details.encabezadosDetectados.length > 0 && (
              <p><strong>Encabezados detectados:</strong> {details.encabezadosDetectados.join(" | ")}</p>
            )}

            {Array.isArray(details.advertencias) && details.advertencias.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <strong>Advertencias:</strong>
                <ul>
                  {details.advertencias.slice(0, 10).map((warning, index) => (
                    <li key={`warning-${index}`}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(details.errores) && details.errores.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <strong>Errores:</strong>
                <ul>
                  {details.errores.slice(0, 10).map((error, index) => (
                    <li key={`error-${index}`}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(details.cursos) && details.cursos.length > 0 && (
              <div style={{ marginTop: "1.5rem" }}>
                <strong>Resumen por curso:</strong>
                <div style={{ display: "grid", gap: "1rem", marginTop: "0.75rem" }}>
                  {details.cursos.map((curso) => (
                    <div
                      key={`${curso.id}-${curso.codigoCapacitacion || curso.nombre}`}
                      style={{ border: "1px solid #d8dee4", borderRadius: "12px", padding: "1rem", background: "#fff" }}
                    >
                      <p><strong>{curso.nombre}</strong></p>
                      <p><strong>Codigo:</strong> {curso.codigoCapacitacion || "Sin codigo"}</p>
                      <p><strong>Red:</strong> {curso.redConocimiento || "Sin red"}</p>
                      <p><strong>Usuarios asignados:</strong> {curso.usuariosAsignados || 0}</p>
                      {curso.evidencia?.resumen && (
                        <p>
                          <strong>Evidencia:</strong>{" "}
                          Cumplio {curso.evidencia.resumen.cumplio || 0} | Pendiente {curso.evidencia.resumen.pendiente || 0} |
                          Revision {curso.evidencia.resumen.pendienteRevision || 0} | Rechazada {curso.evidencia.resumen.rechazada || 0} |
                          Vigente {curso.evidencia.resumen.cursoVigente || 0}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="admin-footer">Panel ENI © 2025</footer>
    </div>
  );
}
