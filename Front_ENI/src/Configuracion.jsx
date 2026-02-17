import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Configuracion() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [config, setConfig] = useState({
    tamanoLetra: "mediano",
    tema: "claro",
    notificaciones: true,
    idioma: "español"
  });
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    const datosUsuario = JSON.parse(localStorage.getItem("usuario"));
    const token = localStorage.getItem("token");

    if (!token || !datosUsuario) {
      navigate("/login");
    } else {
      setUsuario(datosUsuario);
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
        <button className="btn-volver" onClick={() => navigate(-1)}>
          ← Volver
        </button>
        <h2>⚙️ Configuración del Sistema</h2>
      </header>

      <main className="config-main">
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

        <div className="config-actions">
          <button className="btn-restaurar" onClick={restaurarValores}>
            🔄 Restaurar valores por defecto
          </button>
          <button className="btn-guardar" onClick={guardarConfiguracion}>
            💾 Guardar configuración
          </button>
        </div>

        {guardado && (
          <div className="config-mensaje-exito">
            ✅ Configuración guardada correctamente
          </div>
        )}
      </main>
    </div>
  );
}
