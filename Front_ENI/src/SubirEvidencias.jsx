import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "./config/api";

export default function SubirEvidencias() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState("");
  const [enviando, setEnviando] = useState(false);

  const [formulario, setFormulario] = useState({
    documento: "",
    nombre: "",
    codRegional: "",
    regional: "",
    codCentro: "",
    centroFormacion: "",
    descripcion: "",
  });

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

    // Si no hay datos, hace fetch al endpoint de perfil
    if (!usuario.documento || !usuario.nombre) {
      const token = localStorage.getItem("token");
      fetch(apiUrl("/api/usuarios/perfil"), {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          console.log("=== DATOS DEL SERVIDOR /perfil ===");
          console.log("Respuesta completa:", data);
          console.log("Documento:", data.documento);
          console.log("Nombre:", data.nombre);
          console.log("Regional ID:", data.regionalId);
          console.log("Regional Nombre:", data.regionalNombre);
          console.log("Centro ID:", data.centroFormacionId);
          console.log("Centro Nombre:", data.centroNombre);

          if (data.documento || data.id) {
            // Mapear los campos para mantener compatibilidad con el formato del login
            const usuarioActualizado = {
              ...data,
              regionalNor: data.regionalNombre,
              centroForm: data.centroFormacionId,
              centroNoml: data.centroNombre
            };
            localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
            cargarFormulario(usuarioActualizado);
          }
        })
        .catch(error => console.error("Error al obtener perfil:", error));
    } else {
      cargarFormulario(usuario);
    }
  }, []);

  const cargarFormulario = (usuario) => {
    // Normalizar - aceptar tanto del login (regionalNor) como del /perfil (regionalNombre)
    const regionalNom = usuario.regionalNombre || usuario.regionalNor || "";
    const centroId = usuario.centroFormacionId || usuario.centroForm || "";
    const centroNom = usuario.centroNombre || usuario.centroNoml || "";

    console.log("Cargando formulario con:", {
      documento: usuario.documento,
      nombre: usuario.nombre,
      regionalId: usuario.regionalId,
      regionalNombre: regionalNom,
      centroFormacionId: centroId,
      centroNombre: centroNom,
    });

    setFormulario({
      documento: usuario.documento || "",
      nombre: usuario.nombre || "",
      codRegional: usuario.regionalId || "",
      regional: regionalNom,
      codCentro: centroId,
      centroFormacion: centroNom,
      descripcion: "",
    });
  };

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  if (usuario.rol === "Administrador") {
    return (
      <div className="notificacion-page">
        <div className="notificacion-card">
          <h2 className="notificacion-title">📎 Reporte</h2>
          <p className="notificacion-subtitle">
            Los administradores no diligencian reportes.
          </p>
          <button
            type="button"
            className="btn-panel"
            onClick={() => navigate("/administrador")}
          >
            🏠 Panel de Usuario
          </button>
        </div>
      </div>
    );
  }

  const enviarReporte = async () => {
    const token = localStorage.getItem("token");

    setEnviando(true);
    setEstado("");

    try {
      const res = await fetch(apiUrl("/api/usuarios/reportes"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formulario),
      });

      const data = await res.json();

      if (res.ok) {
        setEstado(`✅ ${data.mensaje}`);
        setFormulario((prev) => ({
          ...prev,
          descripcion: "",
        }));
      } else {
        setEstado(`❌ ${data.mensaje || "Error al enviar el reporte"}`);
      }
    } catch (error) {
      console.error("Error al enviar reporte:", error);
      setEstado("❌ Error al enviar el reporte");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="notificacion-page">
      <div className="notificacion-card">
        <h2 className="notificacion-title">📎 Reporte de Información</h2>
        <p className="notificacion-subtitle">
          Información del instructor cargada automáticamente.
        </p>

        <div className="form-group">
          <label>
            Para cargar tu evidencia entra a este enlace y busca tu nombre:
          </label>

          <input
            className="input-control"
            value="https://drive.google.com/drive/u/0/folders/1Bx5FZ7aEECGqisCFeeNcozHSjJz5P-IV"
            readOnly
          />

          <button
            onClick={() => window.open("https://drive.google.com/drive/u/0/folders/1Bx5FZ7aEECGqisCFeeNcozHSjJz5P-IV", "_blank")}
          >
            Abrir enlace
          </button>
        </div>
        {/* CAMPOS AUTOMÁTICOS */}
        <div className="form-group">
          <label>Documento</label>
          <input className="input-control" value={formulario.documento} readOnly />
        </div>

        <div className="form-group">
          <label>Nombre</label>
          <input className="input-control" value={formulario.nombre} readOnly />
        </div>

        <div className="form-group">
          <label>Código Regional</label>
          <input className="input-control" value={formulario.codRegional} readOnly />
        </div>

        <div className="form-group">
          <label>Regional</label>
          <input className="input-control" value={formulario.regional} readOnly />
        </div>

        <div className="form-group">
          <label>Código Centro</label>
          <input className="input-control" value={formulario.codCentro} readOnly />
        </div>

        <div className="form-group">
          <label>Centro de Formación</label>
          <input className="input-control" value={formulario.centroFormacion} readOnly />
        </div>

        {/* CAMPO EDITABLE */}
        <div className="form-group">
          <label>Descripción</label>
          <textarea
            className="input-control textarea-control"
            rows={3}
            value={formulario.descripcion}
            onChange={(e) =>
              setFormulario({ ...formulario, descripcion: e.target.value })
            }
          />
        </div>

        {estado && <p className="notificacion-estado">{estado}</p>}

        <div className="notificacion-actions" style={{ marginTop: "1.5rem" }}>
          <button
            className="btn-panel"
            onClick={() => navigate("/usuario")}
          >
            🏠 Panel de Usuario
          </button>

          <button
            className="btn-anim btn-notificacion"
            onClick={enviarReporte}
            disabled={enviando}
          >
            {enviando ? "Enviando…" : "Enviar reporte"}
          </button>
        </div>
      </div>
    </div>
  );
}