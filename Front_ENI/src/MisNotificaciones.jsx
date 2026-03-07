import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl, uploadsUrl } from "./config/api";

export default function MisNotificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [estado, setEstado] = useState("");
  const noLeidas = notificaciones.filter((n) => !n.leida).length;
  const navigate = useNavigate();


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetch(apiUrl("/api/usuarios/mis-notificaciones"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setNotificaciones(data.notificaciones || []))
      .catch(() =>
        setEstado("⚠️ No se pudieron cargar tus notificaciones")
      );
  }, [navigate]);

  const marcarLeida = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        apiUrl(`/api/usuarios/notificaciones/${id}/marcar-leida`),
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        setEstado("⚠️ No se pudo marcar como leída");
        return;
      }
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: 1 } : n))
      );
    } catch (e) {
      console.error(e);
      setEstado("⚠️ Error de conexión al marcar como leída");
    }
  };

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const esAdmin = usuario.rol === "Administrador";

  const parseArchivos = (archivosRaw) => {
    if (!archivosRaw) return { files: [], folderLink: null };
    try {
      const parsed = JSON.parse(archivosRaw);
      if (Array.isArray(parsed)) {
        return { files: parsed, folderLink: null };
      }
      return {
        files: Array.isArray(parsed?.files) ? parsed.files : [],
        folderLink: parsed?.folderLink || null,
      };
    } catch {
      return { files: [], folderLink: null };
    }
  };

  const getArchivoUrl = (ruta) => {
    if (typeof ruta !== "string" || !ruta) return "#";
    if (ruta.startsWith("http://") || ruta.startsWith("https://")) {
      if (ruta.includes("drive.google.com")) {
        const matchByFile = ruta.match(/\/file\/d\/([^/]+)/);
        const matchByIdParam = ruta.match(/[?&]id=([^&]+)/);
        const fileId = matchByFile?.[1] || matchByIdParam?.[1];

        if (fileId) {
          return `https://drive.google.com/file/d/${fileId}/view?usp=drive_link&v=${Date.now()}`;
        }
      }
      return `${ruta}${ruta.includes("?") ? "&" : "?"}v=${Date.now()}`;
    }
    return uploadsUrl(`/${ruta.replace(/^\/+/, "")}`);
  };


  return (

    <div className="notificacion-page">
      <div className="notificacion-card mis-notificaciones-card">
        <h2 className="notificacion-title">
          📩 Mis notificaciones {noLeidas > 0 && `(${noLeidas} sin leer)`}
        </h2>
        <p className="notificacion-subtitle">
          {esAdmin
            ? "Aquí verás las evidencias que los usuarios han subido y las notificaciones del sistema."
            : "Aquí verás todos los mensajes que el administrador ha enviado a tu red."}
        </p>

        {estado && <p className="notificacion-estado">{estado}</p>}

        {notificaciones.length === 0 ? (
          <p className="notificaciones-empty">No tienes notificaciones.</p>
        ) : (
          <ul className="notificaciones-list">
            {notificaciones.map((n) => {
              const archivosData = parseArchivos(n.archivos);
              const archivos = (archivosData.files || [])
                .map((item) => (typeof item === "string" ? item : item?.url || ""))
                .filter(Boolean);
              const folderLink = archivosData.folderLink;
              return (
                <li
                  key={n.id}
                  className={
                    n.leida ? "notificacion-item leida" : "notificacion-item no-leida"
                  }
                >
                  <div className="notificacion-content">
                    <strong className="notificacion-asunto">{n.asunto}</strong>
                    <p className="notificacion-mensaje">{n.mensaje}</p>

                    {esAdmin && folderLink && (
                      <ul className="notificacion-archivos-list">
                        <li className="notificacion-archivo-item">
                          <a
                            className="notificacion-archivo-link"
                            href={getArchivoUrl(folderLink)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Abrir evidencias del usuario
                          </a>
                        </li>
                      </ul>
                    )}

                    {(!esAdmin || !folderLink) && archivos.length > 0 && (
                      <ul className="notificacion-archivos-list">
                        {archivos.map((ruta, idx) => (
                          <li key={idx} className="notificacion-archivo-item">
                            <a
                              className="notificacion-archivo-link"
                              href={getArchivoUrl(ruta)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Ver PDF {idx + 1}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}

                    <small className="notificacion-fecha">
                      {new Date(n.creadaEn).toLocaleString("es-CO", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </small>
                  </div>

                  {!n.leida && (
                    <button
                      className="notificacion-btn"
                      type="button"
                      onClick={() => marcarLeida(n.id)}>

                      Marcar como leída

                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="notificacion-actions notificacion-actions-bottom">
          <button
            type="button"
            className="notificacion-btn notificacion-btn-cerrar"
            onClick={() => navigate(esAdmin ? "/administrador" : "/usuario")}>
            Volver a mi panel
          </button>
        </div>
      </div>
    </div>
  );
}
