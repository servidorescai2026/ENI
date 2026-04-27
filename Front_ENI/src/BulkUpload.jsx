import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BulkUploadUsers from "./services/Usuarios/BulkUploadUsers";

export default function BulkUpload() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setMessage("");
    setDetails(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage("Selecciona un archivo primero");
      return;
    }
    setLoading(true);
    try {
      const result = await BulkUploadUsers(selectedFile);
      if (result) {
        setMessage(result.mensaje || "Importación completada");
        setDetails(result.detalles || null);
      }
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Error al enviar archivo");
      setDetails(err.detalles || null);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate("/gestion-usuarios");
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="admin-top">
          <div className="admin-welcome">
            <h2 className="welcome-text">
              Carga masiva de usuarios 📄
            </h2>
          </div>
          <div className="header-buttons">
            <button className="btn-anim btn-notificacion" onClick={goBack} type="button">
              ← Volver a Gestión
            </button>
          </div>
        </div>
      </header>
      <main className="admin-main">
        <form onSubmit={handleSubmit} className="bulk-form" style={{maxWidth:'500px',margin:'2rem auto'}}>
          <div className="form-group">
            <label htmlFor="file">Archivo (.xlsx, .xls, .csv):</label>
            <input
              type="file"
              id="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
            />
          </div>

          <button type="submit" className="btn-anim" disabled={loading}>
            {loading ? "Enviando..." : "Subir archivo"}
          </button>
        </form>
        {message && <p className="form-message">{message}</p>}
        {details && (
          <div className="bulk-details" style={{ maxWidth: "800px", margin: "1rem auto", textAlign: "left" }}>
            <p><strong>Usuarios creados:</strong> {details.usuariosCreados || 0}</p>
            <p><strong>Usuarios reutilizados:</strong> {details.usuariosReutilizados || 0}</p>
            <p><strong>Vínculos a cursos:</strong> {details.cursosVinculados || 0}</p>
            <p><strong>Inscripciones creadas:</strong> {details.inscripcionesCreadas || 0}</p>
            <p><strong>Filas omitidas:</strong> {details.filasOmitidas || 0}</p>
            {Array.isArray(details.encabezadosDetectados) && details.encabezadosDetectados.length > 0 && (
              <p><strong>Encabezados detectados:</strong> {details.encabezadosDetectados.join(" | ")}</p>
            )}
            {Array.isArray(details.errores) && details.errores.length > 0 && (
              <div>
                <strong>Primeros errores:</strong>
                <ul>
                  {details.errores.slice(0, 10).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(details.resultados) && details.resultados.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <strong>Resultado por usuario:</strong>
                <ul>
                  {details.resultados.slice(0, 25).map((item, index) => (
                    <li key={index}>
                      Fila {item.fila}: {item.nombre} {item.apellido} - {item.estadoUsuario === "creado" ? "creado" : "ya existía"}
                      {item.cursoAsignado ? ` - asignado a ${item.cursoAsignado.nombre}` : " - sin curso vinculado"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
      <footer className="admin-footer">Panel ENI © 2025</footer>
    </div>
  );
}
