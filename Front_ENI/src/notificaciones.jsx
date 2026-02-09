import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function EnviarNotificacionPorArea() {
  const navigate = useNavigate();
  const [mensaje, setMensaje] = useState("");
  const [asunto, setAsunto] = useState("");
  const [areas, setAreas] = useState([]);
  const [estado, setEstado] = useState("");
  const [archivos, setArchivos] = useState([]);
  const [areasSeleccionadas, setAreasSeleccionadas] = useState([]);
  const [areaSeleccionTemporal, setAreaSeleccionTemporal] = useState("");
  // const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://localhost:3000/api/areas")
      .then((res) => res.json())
      .then((data) => setAreas(data.areas || data))
      .catch(() => setEstado("⚠️ No se pudieron cargar las áreas"));
  }, []);

  const enviarNotificacion = async () => {
    const token = localStorage.getItem("token");
    const areaIds = areasSeleccionadas.map((a) => a.id);
  
    if (!areaIds.length || !asunto || !mensaje) {
      setEstado("⚠️ Selecciona un área y escribe asunto y mensaje");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("areaIds", JSON.stringify(areaIds));
      formData.append("asunto", asunto);
      formData.append("mensaje", mensaje);

      archivos
      .filter((a) => a.file)
      .forEach((a) => {
        formData.append("archivos", a.file);
      });

      const res = await fetch(
        "http://localhost:3000/api/usuarios/notificar-por-area",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (res.ok) {
        setEstado(`✅ ${data.mensaje}`);
        setMensaje("");
        setAsunto("");
        setAreasSeleccionadas([]);
        setArchivos([]);
      } else {
        setEstado(`❌ ${data.mensaje || "Error al enviar notificación"}`);
      }
    } catch (err) {
      console.error(err);
      setEstado("⚠️ Error de conexión con el servidor");
    }
  };

  return (
    <div className="notificacion-page">
      <div className="notificacion-card">
        <h2 className="notificacion-title">🔔 Enviar notificación por Red</h2>
        <p className="notificacion-subtitle">
          Selecciona una red de conocimiento y escribe el mensaje que recibirán
          sus usuarios.
        </p>

        {/* Selector de áreas + botón Agregar */}
        <div className="form-group">
          <label>Red / Área</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <select
              className="input-control"
              value={areaSeleccionTemporal}
              onChange={(e) => setAreaSeleccionTemporal(e.target.value)}
            >
              <option value="">Selecciona un área</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.codigo} - {a.nombre}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn-anim"
              onClick={() => {
                if (!areaSeleccionTemporal) return;

                const yaExiste = areasSeleccionadas.some(
                  (a) => a.id === Number(areaSeleccionTemporal)
                );
                if (yaExiste) return;

                const areaObj = areas.find(
                  (a) => a.id === Number(areaSeleccionTemporal)
                );
                if (!areaObj) return;

                setAreasSeleccionadas((prev) => [...prev, areaObj]);
                setAreaSeleccionTemporal("");
              }}
            >
              Agregar
            </button>
          </div>
        </div>

        {/* Cuadro bonito con áreas seleccionadas */}
        {areasSeleccionadas.length > 0 && (
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "1px solid #e0e0e0",
              background: "#f9fafb",
            }}
          >
            <p
              style={{
                margin: "0 0 0.5rem 0",
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "#374151",
              }}
            >
              Áreas seleccionadas:
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              {areasSeleccionadas.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.35rem 0.6rem",
                    borderRadius: "999px",
                    background: "#e0f2fe",
                    color: "#0f172a",
                    fontSize: "0.85rem",
                  }}
                >
                  <span>
                    {a.codigo} - {a.nombre}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAreasSeleccionadas((prev) =>
                        prev.filter((x) => x.id !== a.id)
                      )
                    }
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#0f172a",
                      cursor: "pointer",
                      fontWeight: "bold",
                      lineHeight: 1,
                    }}
                    title="Quitar área"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Asunto */}
        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label>Asunto</label>
          <input
            className="input-control"
            type="text"
            placeholder="Asunto de la notificación"
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
          />
        </div>

        {/* Mensaje */}
        <div className="form-group">
          <label>Mensaje</label>
          <textarea
            className="input-control textarea-control"
            placeholder="Escribe el mensaje que se enviará a los usuarios de la red seleccionada..."
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={5}
          />
        </div>

        {/* PDFs */}
        <div className="form-group">
          <label>Adjuntar PDFs (máx. 5)</label>

          {/* Lista de inputs de archivo */}
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
                    prev.map((a) =>
                      a.id === item.id ? { ...a, file } : a
                    )
                  );
                }}
              />
              {item.file && (
                <span style={{ fontSize: "0.8rem" }}>
                  {item.file.name}
                </span>
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

          {/* Botón para añadir una nueva fila de PDF */}
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
              + Agregar PDF
            </button>
          )}

          {archivos.length > 0 && (
            <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
              Archivos: {archivos.filter((a) => a.file).length} / 5 seleccionados
            </p>
          )}
        </div>


        {/* Botones */}
        <div className="notificacion-actions">
          <button
            type="button"
            className="btn-anim btn-cerrar"
            onClick={() => navigate("/administrador")}
          >
            Volver a mi panel
          </button>
          <button
            className="btn-anim btn-notificacion"
            type="button"
            onClick={enviarNotificacion}
          >
            Enviar Notificación
          </button>
        </div>

        {estado && <p className="notificacion-estado">{estado}</p>}
      </div>
    </div>
  );
}
