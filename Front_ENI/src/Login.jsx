import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { apiUrl } from "./config/api";
import { RECAPTCHA_SITE_KEY } from "./config/recaptcha";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [mensaje, setMensaje] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    // NO hacer trim() en la contraseña para permitir espacios si el usuario los necesita
    setFormData({ ...formData, [name]: name === "password" ? value : value.trim() });
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
      setIsLoggingIn(true);
      const res = await fetch(apiUrl("/api/usuarios/login"), {
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
        localStorage.setItem("token", data.token);
        localStorage.setItem("usuario", JSON.stringify(data.usuario));
        localStorage.setItem(
          "requiereCambioPassword",
          data.requiereCambioPassword ? "true" : "false"
        );

        setMensaje("✅ Inicio de sesión exitoso");
        // Resetear el captcha
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }
        setCaptchaToken(null);

        setTimeout(() => {
          if (data.requiereCambioPassword) {
            navigate("/configuracion");
          } else if (data.usuario.rol === "Administrador") {
            navigate("/administrador");
          } else {
            navigate("/usuario");
          }
        }, 1500);
      } else {
        setMensaje(data.mensaje || "❌ Credenciales incorrectas");
        // Resetear el captcha en caso de error
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }
        setCaptchaToken(null);
      }
    } catch (error) {
      console.error("Error al conectar:", error);
      setMensaje("⚠️ No se pudo conectar al servidor");
      // Resetear el captcha en caso de error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setCaptchaToken(null);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Iniciar Sesión</h2>

        <input
          type="text"
          name="email"
          placeholder="Correo electrónico SENA"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <div className="input-password">
          <input
            type={mostrarPassword ? "text" : "password"}
            name="password"
            placeholder="Número de documento (Cédula)"
            value={formData.password}
            onChange={handleChange}
            required
            
          />
          <span onClick={() => setMostrarPassword(!mostrarPassword)}>
            {mostrarPassword ? "🙉" : "🙈"}
          </span>
        </div>

        <div className="recaptcha-container">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={RECAPTCHA_SITE_KEY}
            onChange={handleCaptchaChange}
          />
        </div>

        <button type="submit" disabled={isLoggingIn || !captchaToken}>
          {isLoggingIn ? "Iniciando sesión..." : "Entrar"}
        </button>
        {mensaje && <p className="mensaje">{mensaje}</p>}
      </form>
    </div>
  );
}
