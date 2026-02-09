import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

import { RECAPTCHA_SITE_KEY } from "./config/recaptcha";
import { iniciarTourRegistro } from "./utils/tours";

export default function Registro() {
  const navigate = useNavigate();
  

  const usuarioActual = JSON.parse(localStorage.getItem("usuario")); // 🔹 Usuario logueado

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    codigoArea: "",
    rol: usuarioActual?.rol === "Administrador" ? "" : "Formador",
  });

  const [mensaje, setMensaje] = useState("");
  const [areas, setAreas] = useState([]);
  const [captchaToken, setCaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);

   useEffect(() => {
    // Cargar áreas al montar el componente
    fetch("http://localhost:3000/api/areas")
      .then((res) => res.json())
      .then((data) => setAreas(data.areas || data)) // depende de cómo las devuelves
      .catch(() =>
        setMensaje("⚠️ No se pudieron cargar las áreas, intenta más tarde")
      );
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value.trim(),
    });
  };

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (!captchaToken) {
      setMensaje("❌ Por favor completa la verificación reCAPTCHA");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/usuarios/register", {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          captchaToken: captchaToken,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje("✅ Registro exitoso.");

        // Resetear el captcha
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }
        setCaptchaToken(null);

        if (usuarioActual?.rol === "Administrador") {
          setTimeout(() => {
            window.location.href = "/administrador";
          }, 1500);
        } else {
          setMensaje(
            "✅ Registro exitoso. Redirigiendo al inicio de sesión..."
          );
          setTimeout(() => navigate("/login"), 1000);
        }

      } else {
        setMensaje(`${data.mensaje} - ${data.error || ""}`);
        // Resetear el captcha en caso de error
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }
        setCaptchaToken(null);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setMensaje("⚠️ No se pudo conectar al servidor");
      // Resetear el captcha en caso de error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setCaptchaToken(null);
    }
  };

  return (
    <div className="registro-container">
      <button
        type="button"
        className="btn-tour"
        onClick={iniciarTourRegistro}
        title="Ver guía de uso"
      >
        ❓ Ayuda
      </button>
      <form className="registro-form" onSubmit={handleSubmit}>
        <h2>Registro de Usuario</h2>

        <input
          type="text"
          name="nombre"
          placeholder="Nombre completo"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="apellido"
          placeholder="Apellido completo"
          value={formData.apellido}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Correo electrónico actual"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <select
          name="codigoArea"
          value={formData.codigoArea}
          onChange={handleChange}
          required
        >
          <option value="">Selecciona un área</option>
          {areas.map((a) => (
            <option key={a.id} value={a.codigo}>
              {a.codigo} - {a.nombre}
            </option>
          ))}
        </select>

        {usuarioActual?.rol === "Administrador" && (
          <select
            name="rol"
            value={formData.rol}
            onChange={handleChange}
            required
          >
            <option value="">Seleccionar rol</option>
            <option value="Formador">Formador</option>
            <option value="Administrador">Administrador</option>
          </select>
        )}

        <div className="recaptcha-container">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={RECAPTCHA_SITE_KEY}
            onChange={handleCaptchaChange}
          />
        </div>

        <div className="botones">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            ⬅️ Regresar
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!captchaToken}
          >
            Registrarse
          </button>
        </div>

        {mensaje && <p className="mensaje">{mensaje}</p>}
      </form>
    </div>
  );
}
