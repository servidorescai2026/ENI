import fetch from "node-fetch";

// Middleware para verificar reCAPTCHA (Google).
// - Acepta token en: body.captchaToken, query.captchaToken, header 'x-captcha-token' o 'captcha-token'
// - Usa `CAPTCHA_SECRET` en .env
// - Si `CAPTCHA_DISABLED=true` se omite la verificación (útil en desarrollo)
// - Opcionalmente, para reCAPTCHA v3 se pueden configurar `CAPTCHA_MIN_SCORE` y `CAPTCHA_EXPECTED_ACTION`
export default async function verifyCaptcha(req, res, next) {
  try {
    // Allow bypass in development if explicitly set
    if (process.env.CAPTCHA_DISABLED === "true") {
      req.captcha = { bypassed: true };
      return next();
    }

    const token = req.body?.captchaToken || req.query?.captchaToken || req.get("x-captcha-token") || req.get("captcha-token");
    if (!token) {
      return res.status(400).json({ mensaje: "Captcha token requerido" });
    }

    const secret = process.env.CAPTCHA_SECRET;
    if (!secret) {
      console.error("CAPTCHA_SECRET no definido en variables de entorno");
      return res.status(500).json({ mensaje: "Servidor no configurado para validar captcha" });
    }

    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token);

    const resp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!resp.ok) {
      console.error("recaptcha siteverify request failed", resp.status, await resp.text());
      return res.status(502).json({ mensaje: "Error al validar captcha (proveedor)" });
    }

    const data = await resp.json();

    // Basic success check
    if (!data.success) {
      return res.status(403).json({ mensaje: "Fallo validación captcha", detalle: data["error-codes"] || null });
    }

    // Optional: reCAPTCHA v3 score check
    const minScoreEnv = process.env.CAPTCHA_MIN_SCORE;
    if (minScoreEnv && typeof data.score === "number") {
      const minScore = parseFloat(minScoreEnv);
      if (isNaN(minScore) === false && data.score < minScore) {
        return res.status(403).json({ mensaje: "Captcha score insuficiente", score: data.score, minScore });
      }
    }

    // Optional: expected action (v3)
    const expectedAction = process.env.CAPTCHA_EXPECTED_ACTION;
    if (expectedAction && data.action && data.action !== expectedAction) {
      return res.status(403).json({ mensaje: "Captcha action inválida", action: data.action, expected: expectedAction });
    }

    // Attach result for downstream handlers
    req.captcha = data;
    return next();
  } catch (error) {
    console.error("Error al verificar captcha:", error?.message || error);
    return res.status(500).json({ mensaje: "Error verificando captcha", error: error?.message || String(error) });
  }
}
