import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SubirEvidencias() {
  const navigate = useNavigate();
  const [descripcion, setDescripcion] = useState("");
  const [archivos, setArchivos] = useState([{ id: 1, file: null }]);
  const [estado, setEstado] = useState("");
  const [enviando, setEnviando] = useState(false);

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  if (usuario.rol === "Administrador") {
    return (
      <div className="notificacion-page">
        <div className="notificacion-card">
          <h2 className="notificacion-title">📎 Subir evidencias</h2>
          <p className="notificacion-subtitle">
            Los administradores no pueden subir evidencias. Las evidencias son enviadas por los usuarios para que usted las revise.
          </p>
          <button
            type="button"
            className="btn-anim btn-cerrar"
            onClick={() => navigate("/administrador")}
          >
            Volver al panel
          </button>
        </div>
      </div>
    );
  }

  const subirEvidencia = async () => {
    const token = localStorage.getItem("token");
    const archivosConFile = archivos.filter((a) => a.file);

    if (archivosConFile.length === 0) {
      setEstado("⚠️ Debes seleccionar al menos un archivo PDF");
      return;
    }

    setEnviando(true);
    setEstado("");

    try {
      const formData = new FormData();
      formData.append("descripcion", descripcion);
      archivosConFile.forEach((a) => {
        formData.append("archivos", a.file);
      });

      const res = await fetch("http://localhost:3000/api/usuarios/subir-evidencia", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setEstado(`✅ ${data.mensaje}`);
        setDescripcion("");
        setArchivos([{ id: Date.now(), file: null }]);
      } else {
        setEstado(`❌ ${data.mensaje || "Error al subir evidencia"}`);
      }
    } catch (err) {
      console.error(err);
      setEstado("⚠️ Error de conexión con el servidor");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="notificacion-page">
      <div className="notificacion-card">
        <h2 className="notificacion-title">📎 Subir evidencias</h2>
        <p className="notificacion-subtitle">
          Sube tus evidencias en formato PDF. El administrador recibirá una notificación y podrá revisarlas.
        </p>

        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label>Descripción (opcional)</label>
          <textarea
            className="input-control textarea-control"
            placeholder="Añade una descripción o comentario sobre las evidencias..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Archivos PDF (máx. 5)</label>
          {archivos.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}
            >
              <input
                className="input-control"
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files[0] || null;
                  setArchivos((prev) =>
                    prev.map((a) => (a.id === item.id ? { ...a, file } : a))
                  );
                }}
              />
              {item.file && (
                <span style={{ fontSize: "0.8rem" }}>{item.file.name}</span>
              )}
              <button
                type="button"
                className="btn-anim btn-cerrar"
                onClick={() =>
                  setArchivos((prev) => prev.filter((a) => a.id !== item.id))
                }
              >
                Quitar
              </button>
            </div>
          ))}
          {archivos.length < 5 && (
            <button
              type="button"
              className="btn-anim"
              onClick={() => {
                setArchivos((prev) => [
                  ...prev,
                  { id: Date.now() + Math.random(), file: null },
                ]);
              }}
            >
              + Agregar otro PDF
            </button>
          )}
          {archivos.filter((a) => a.file).length > 0 && (
            <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
              Archivos: {archivos.filter((a) => a.file).length} / 5 seleccionados
            </p>
          )}
        </div>

        {estado && <p className="notificacion-estado">{estado}</p>}

        <div className="notificacion-actions" style={{ marginTop: "1.5rem" }}>
          <button
            type="button"
            className="btn-anim btn-cerrar"
            onClick={() => navigate("/usuario")}
          >
            Volver a mi panel
          </button>
          <button
            className="btn-anim btn-notificacion"
            type="button"
            onClick={subirEvidencia}
            disabled={enviando}
          >
            {enviando ? "Subiendo…" : "Subir evidencias"}
          </button>
        </div>
      </div>
    </div>
  );
}
