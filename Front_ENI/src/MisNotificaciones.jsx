import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl, uploadsUrl } from "./config/api";

export default function MisNotificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [estado, setEstado] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState("");
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

  const eliminarTodas = async () => {
    if (notificaciones.length === 0) {
      setEstado("⚠️ No tienes notificaciones para eliminar");
      return;
    }

    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar todas tus notificaciones? Esta acción no se puede deshacer."
    );

    if (!confirmar) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(apiUrl("/api/usuarios/notificaciones/eliminar-todas"), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        setEstado(`⚠️ ${data.mensaje || "No se pudieron eliminar las notificaciones"}`);
        return;
      }

      setNotificaciones([]);
      setEstado(`✅ ${data.mensaje || "Notificaciones eliminadas"}`);
    } catch (e) {
      console.error(e);
      setEstado("⚠️ Error de conexión al eliminar las notificaciones");
    }
  };

  const eliminarNotificacion = async (id) => {
    const confirmar = window.confirm(
      "¿Deseas eliminar esta notificación?"
    );

    if (!confirmar) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(apiUrl(`/api/usuarios/notificaciones/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        setEstado(`⚠️ ${data.mensaje || "No se pudo eliminar la notificación"}`);
        return;
      }

      setNotificaciones((prev) => prev.filter((n) => n.id !== id));
      setEstado("✅ Notificación eliminada");
    } catch (e) {
      console.error(e);
      setEstado("⚠️ Error de conexión al eliminar la notificación");
    }
  };

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const esAdmin = usuario.rol === "Administrador";

  const getArchivoUrl = (ruta) => {
    if (!ruta) return "";
    if (/^https?:\/\//i.test(ruta)) return ruta;
    return uploadsUrl(ruta);
  };

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

  const renderMensajeConEnlaces = (mensaje) => {
    if (!mensaje) return "";

    // Regex para detectar URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const elementos = [];
    let ultimoIndice = 0;
    let match;

    // Crear regex nuevamente para cada búsqueda
    const regexParaBuscar = /(https?:\/\/[^\s]+)/g;

    while ((match = regexParaBuscar.exec(mensaje)) !== null) {
      // Agregar texto antes de la URL
      if (match.index > ultimoIndice) {
        const textoBefore = mensaje.substring(ultimoIndice, match.index);
        elementos.push(
          <React.Fragment key={`texto-${ultimoIndice}`}>
            {textoBefore.split("\n").map((linea, idx) => (
              <React.Fragment key={idx}>
                {linea}
                {idx < textoBefore.split("\n").length - 1 && <br />}
              </React.Fragment>
            ))}
          </React.Fragment>
        );
      }

      // Agregar la URL como enlace
      elementos.push(
        <a
          key={`url-${match.index}`}
          href={match[0]}
          target="_blank"
          rel="noreferrer"
          style={{
            color: "#0066cc",
            textDecoration: "underline",
            fontWeight: "bold",
            wordBreak: "break-all",
            display: "inline-block",
            marginTop: "0.5rem",
          }}
        >
          {match[0]}
        </a>
      );

      ultimoIndice = regexParaBuscar.lastIndex;
    }

    // Agregar texto restante
    if (ultimoIndice < mensaje.length) {
      const textoAfter = mensaje.substring(ultimoIndice);
      elementos.push(
        <React.Fragment key={`texto-final`}>
          {textoAfter.split("\n").map((linea, idx) => (
            <React.Fragment key={idx}>
              {linea}
              {idx < textoAfter.split("\n").length - 1 && <br />}
            </React.Fragment>
          ))}
        </React.Fragment>
      );
    }

    return elementos.length > 0 ? elementos : mensaje;
  };

  const obtenerFechaLocal = (fecha) => {
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const notificacionesFiltradas = notificaciones.filter((n) => {
    if (!fechaFiltro) return true;
    return obtenerFechaLocal(n.creadaEn) === fechaFiltro;
  });


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

        <div className="form-group" style={{ marginTop: "0.75rem" }}>
          <label>Buscar por fecha</label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input
              type="date"
              className="input-control"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
            />
            <button
              type="button"
              className="notificacion-btn"
              onClick={() => setFechaFiltro("")}
              disabled={!fechaFiltro}
            >
              Limpiar
            </button>
          </div>
        </div>

        {estado && <p className="notificacion-estado">{estado}</p>}

        {notificacionesFiltradas.length === 0 ? (
          <p className="notificaciones-empty">
            {fechaFiltro
              ? "No hay notificaciones para la fecha seleccionada."
              : "No tienes notificaciones."}
          </p>
        ) : (
          <ul className="notificaciones-list">
            {notificacionesFiltradas.map((n) => {
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
                    <p className="notificacion-mensaje">{renderMensajeConEnlaces(n.mensaje)}</p>

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

                  <button
                    className="notificacion-btn notificacion-btn-danger"
                    type="button"
                    onClick={() => eliminarNotificacion(n.id)}
                  >
                    Eliminar
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="notificacion-actions notificacion-actions-bottom">
          <button
            type="button"
            className="notificacion-btn"
            onClick={eliminarTodas}>
            Eliminar todas mis notificaciones
          </button>
          <button
            type="button"
            className="btn-panel"
            onClick={() => navigate(esAdmin ? "/administrador" : "/usuario")}>
            🏠 Panel de Usuario
          </button>
        </div>
      </div>
    </div>
  );
}
