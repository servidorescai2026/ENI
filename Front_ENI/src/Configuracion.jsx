import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authFetch from "./utils/authFetch";
import { apiUrl } from "./config/api";

export default function Configuracion() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [requiereCambioPassword, setRequiereCambioPassword] = useState(false);
  const [config, setConfig] = useState({
    tamanoLetra: "mediano",
    tema: "claro",
    notificaciones: true,
    idioma: "español"
  });
  const [passwordForm, setPasswordForm] = useState({
    passwordActual: "",
    nuevaPassword: "",
    confirmarPassword: "",
  });
  const [guardado, setGuardado] = useState(false);
  const [mensajePassword, setMensajePassword] = useState("");
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [mostrarFormularioPassword, setMostrarFormularioPassword] = useState(false);
  const [mostrarPasswords, setMostrarPasswords] = useState({
    passwordActual: false,
    nuevaPassword: false,
    confirmarPassword: false,
  });

  useEffect(() => {
    const datosUsuario = JSON.parse(localStorage.getItem("usuario") || "null");
    const token = localStorage.getItem("token");
    const cambioObligatorio = localStorage.getItem("requiereCambioPassword") === "true";

    if (!token || !datosUsuario) {
      navigate("/login");
    } else {
      setUsuario(datosUsuario);
      setRequiereCambioPassword(cambioObligatorio);
      setMostrarFormularioPassword(cambioObligatorio);
      // Cargar configuración guardada
      const configGuardada = localStorage.getItem("configuracion");
      if (configGuardada) {
        setConfig(JSON.parse(configGuardada));
        aplicarConfiguracion(JSON.parse(configGuardada));
      }
    }
  }, [navigate]);

  const aplicarConfiguracion = (configuracion) => {
    const root = document.documentElement;
    
    // Aplicar tamaño de letra
    switch (configuracion.tamanoLetra) {
      case "pequeno":
        root.style.setProperty("--font-size-base", "14px");
        break;
      case "mediano":
        root.style.setProperty("--font-size-base", "16px");
        break;
      case "grande":
        root.style.setProperty("--font-size-base", "18px");
        break;
      case "muy-grande":
        root.style.setProperty("--font-size-base", "20px");
        break;
      default:
        root.style.setProperty("--font-size-base", "16px");
    }

    // Aplicar tema
    if (configuracion.tema === "oscuro") {
      root.style.setProperty("--bg-primary", "#1a1a2e");
      root.style.setProperty("--bg-secondary", "#16213e");
      root.style.setProperty("--text-primary", "#eaeaea");
      root.style.setProperty("--text-secondary", "#b8b8b8");
      root.style.setProperty("--card-bg", "#0f3460");
    } else {
      root.style.setProperty("--bg-primary", "#f5f7fa");
      root.style.setProperty("--bg-secondary", "#ffffff");
      root.style.setProperty("--text-primary", "#333333");
      root.style.setProperty("--text-secondary", "#666666");
      root.style.setProperty("--card-bg", "#ffffff");
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newConfig = {
      ...config,
      [name]: type === "checkbox" ? checked : value
    };
    setConfig(newConfig);
    aplicarConfiguracion(newConfig);
  };

  const guardarConfiguracion = () => {
    localStorage.setItem("configuracion", JSON.stringify(config));
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleMostrarPassword = (campo) => {
    setMostrarPasswords((prev) => ({
      ...prev,
      [campo]: !prev[campo],
    }));
  };

  const renderPasswordField = (name, placeholder) => (
    <div className="password-input-wrapper">
      <input
        type={mostrarPasswords[name] ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        value={passwordForm[name]}
        onChange={handlePasswordInputChange}
        required
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => toggleMostrarPassword(name)}
        aria-label={mostrarPasswords[name] ? `Ocultar ${placeholder}` : `Mostrar ${placeholder}`}
        title={mostrarPasswords[name] ? "Ocultar" : "Mostrar"}
      >
        {mostrarPasswords[name] ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMensajePassword("");

    if (!passwordForm.passwordActual || !passwordForm.nuevaPassword || !passwordForm.confirmarPassword) {
      setMensajePassword("Completa todos los campos para cambiar la contraseña.");
      return;
    }

    if (passwordForm.nuevaPassword !== passwordForm.confirmarPassword) {
      setMensajePassword("La nueva contraseña y la confirmación no coinciden.");
      return;
    }

    if (passwordForm.nuevaPassword === passwordActual) {
      setMensajePassword("Debes elegir una contraseña diferente a la temporal predeterminada.");
      return;
    }

    try {
      setGuardandoPassword(true);
      const response = await authFetch(apiUrl("/api/usuarios/cambiar-password"), {
        method: "POST",
        body: JSON.stringify({
          userId: usuario.id,
          passwordActual: passwordForm.passwordActual,
          nuevaPassword: passwordForm.nuevaPassword,
        }),
      });

      if (!response) return;

      const data = await response.json();

      if (!response.ok) {
        setMensajePassword(data.mensaje || "No fue posible cambiar la contraseña.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      localStorage.setItem(
        "requiereCambioPassword",
        data.requiereCambioPassword ? "true" : "false"
      );

      setUsuario(data.usuario);
      setRequiereCambioPassword(Boolean(data.requiereCambioPassword));
      setPasswordForm({ passwordActual: "", nuevaPassword: "", confirmarPassword: "" });
      setMensajePassword("Contrasena actualizada correctamente.");

      if (!data.requiereCambioPassword) {
        setTimeout(() => {
          if (data.usuario.rol === "Administrador") {
            navigate("/administrador");
          } else {
            navigate("/usuario");
          }
        }, 800);
      }
    } catch (error) {
      console.error("Error al cambiar la contrasena:", error);
      setMensajePassword("No se pudo conectar con el servidor.");
    } finally {
      setGuardandoPassword(false);
    }
  };

  const restaurarValores = () => {
    const configPorDefecto = {
      tamanoLetra: "mediano",
      tema: "claro",
      notificaciones: true,
      idioma: "español"
    };
    setConfig(configPorDefecto);
    aplicarConfiguracion(configPorDefecto);
    localStorage.setItem("configuracion", JSON.stringify(configPorDefecto));
  };

  if (!usuario) return <p>Cargando...</p>;

  return (
    <div className="config-container">
      <header className="config-header">
        {!requiereCambioPassword && (
          <button className="btn-volver" onClick={() => navigate(-1)}>
            ← Volver
          </button>
        )}
        <h2>⚙️ Configuración del Sistema</h2>
      </header>

      <main className="config-main">
        {!requiereCambioPassword && (
          <div className="config-section">
            <h3>🔒 Seguridad de acceso</h3>
            <p className="config-texto-secundario">
              Puedes actualizar tu contraseña cuando lo necesites.
            </p>

            <form className="password-change-form" onSubmit={handlePasswordSubmit}>
              <div className="password-grid">
                {renderPasswordField("passwordActual", "Contraseña actual")}
                {renderPasswordField("nuevaPassword", "Nueva contraseña")}
                {renderPasswordField("confirmarPassword", "Confirmar nueva contraseña")}
              </div>

              <div className="password-actions">
                <button className="btn-guardar" type="submit" disabled={guardandoPassword}>
                  {guardandoPassword ? "Guardando..." : "Actualizar contraseña"}
                </button>
              </div>

              {mensajePassword && <div className="config-mensaje-password">{mensajePassword}</div>}
            </form>
          </div>
        )}

        <div className="config-section">
          <h3>🎨 Apariencia</h3>
          
          <div className="config-item">
            <label htmlFor="tamanoLetra">Tamaño de letra</label>
            <select
              id="tamanoLetra"
              name="tamanoLetra"
              value={config.tamanoLetra}
              onChange={handleChange}
              className="config-select"
            >
              <option value="pequeno">Pequeño</option>
              <option value="mediano">Mediano</option>
              <option value="grande">Grande</option>
              <option value="muy-grande">Muy Grande</option>
            </select>
          </div>

          <div className="config-item">
            <label htmlFor="tema">Tema de la interfaz</label>
            <select
              id="tema"
              name="tema"
              value={config.tema}
              onChange={handleChange}
              className="config-select"
            >
              <option value="claro">Claro</option>
              <option value="oscuro">Oscuro</option>
            </select>
          </div>
        </div>

        <div className="config-section">
          <h3>🔔 Notificaciones</h3>
          
          <div className="config-item checkbox-item">
            <label htmlFor="notificaciones">
              <input
                type="checkbox"
                id="notificaciones"
                name="notificaciones"
                checked={config.notificaciones}
                onChange={handleChange}
              />
              Recibir notificaciones del sistema
            </label>
          </div>
        </div>

        <div className="config-section">
          <h3>🌐 Idioma</h3>
          
          <div className="config-item">
            <label htmlFor="idioma">Idioma de la interfaz</label>
            <select
              id="idioma"
              name="idioma"
              value={config.idioma}
              onChange={handleChange}
              className="config-select"
            >
              <option value="español">Español</option>
              <option value="ingles" disabled>Inglés (Próximamente)</option>
            </select>
          </div>
        </div>

        <div className="config-section">
          <h3>ℹ️ Información del Sistema</h3>
          <div className="config-info">
            <p><strong>Versión:</strong> ENI-360 v2.0</p>
            <p><strong>Última actualización:</strong> Febrero 2025</p>
            <p><strong>Usuario actual:</strong> {usuario.nombre} ({usuario.rol})</p>
          </div>
        </div>

        {!requiereCambioPassword && (
          <div className="config-actions">
            <button className="btn-restaurar" onClick={restaurarValores}>
              🔄 Restaurar valores por defecto
            </button>
            <button className="btn-guardar" onClick={guardarConfiguracion}>
              💾 Guardar configuración
            </button>
          </div>
        )}

        {guardado && (
          <div className="config-mensaje-exito">
            ✅ Configuración guardada correctamente
          </div>
        )}
      </main>

      {requiereCambioPassword && (
        <div className="modal-overlay password-modal-overlay">
          <div className="modal-content password-modal-content">
            <div className="modal-header">
              <h3>Cambio obligatorio de contraseña</h3>
            </div>
            <p className="password-modal-text">
              Por seguridad, debes reemplazar la clave temporal "TU CEDULA" antes de acceder al sistema.
            </p>
            <p className="password-modal-text password-modal-text-muted">
              Hasta completar este paso, no podrás navegar a otros módulos.
            </p>
            {!mostrarFormularioPassword && (
              <div className="password-actions password-modal-actions">
                <button
                  type="button"
                  className="btn-guardar"
                  onClick={() => setMostrarFormularioPassword(true)}
                >
                  Cambiar contraseña
                </button>
              </div>
            )}

            {mostrarFormularioPassword && (
              <form className="password-change-form password-modal-form" onSubmit={handlePasswordSubmit}>
                <div className="password-grid password-grid-modal">
                  {renderPasswordField("passwordActual", "Contraseña actual")}
                  {renderPasswordField("nuevaPassword", "Nueva contraseña")}
                  {renderPasswordField("confirmarPassword", "Confirmar nueva contraseña")}
                </div>

                <div className="password-actions password-modal-actions">
                  <button className="btn-guardar" type="submit" disabled={guardandoPassword}>
                    {guardandoPassword ? "Guardando..." : "Actualizar contraseña"}
                  </button>
                </div>

                {mensajePassword && <div className="config-mensaje-password password-modal-message">{mensajePassword}</div>}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
