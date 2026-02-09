import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { RECAPTCHA_SITE_KEY } from "./config/recaptcha";
import { iniciarTourLogin } from "./utils/tours";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [mensaje, setMensaje] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value.trim() });
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
      const res = await fetch("http://localhost:3000/api/usuarios/login", {
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

        setMensaje("✅ Inicio de sesión exitoso");
        // Resetear el captcha
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }
        setCaptchaToken(null);

        setTimeout(() => {
          if (data.usuario.rol === "Administrador") {
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
      <button 
        type="button" 
        className="btn-tour" 
        onClick={iniciarTourLogin}
        title="Ver guía de uso"
      >
        ❓ Ayuda
      </button>
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Iniciar Sesión</h2>

        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
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
