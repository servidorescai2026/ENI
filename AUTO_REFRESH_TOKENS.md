# 🔄 Auto-Refresco de Tokens OAuth2

## ¿Qué cambió?

Ahora **los tokens OAuth2 se refrescan automáticamente sin necesidad de comandos manuales**.

---

## 🏗️ Cómo funciona

### Sistema de 3 capas:

```
┌─────────────────────────────────────────────────────┐
│ 1️⃣ PRIMERA CAPA: Token en memoria (.env)            │
│    - Refresh token (permanente, no expira)          │
│    - Se usa SOLO la primera vez                     │
└─────────────────────────────────────────────────────┘
                        ⬇
┌─────────────────────────────────────────────────────┐
│ 2️⃣ SEGUNDA CAPA: Tokens almacenados (.oauth-tokens.json)
│    - Access token (expira cada ~1 hora)            │
│    - Se reutiliza mientras sea válido              │
│    - 💾 Se actualiza automáticamente                │
└─────────────────────────────────────────────────────┘
                        ⬇
┌─────────────────────────────────────────────────────┐
│ 3️⃣ TERCERA CAPA: Google Drive                        │
│    - Solo se llama si el access token expiró       │
│    - Se obtiene uno nuevo automáticamente          │
└─────────────────────────────────────────────────────┘
```

### Proceso paso a paso:

1. **Primer uso**: Se lee el refresh token del `.env`
2. **Se genera access token**: Llamada a Google (rápida)
3. **Se guarda automáticamente**: En `.oauth-tokens.json` (local)
4. **Próximas llamadas**: Se reutiliza si está válido = sin llamadas a Google ✨
5. **Si expira**: Se regenera automáticamente del refresh token
6. **Si cambias de cuenta**: Detecta que el refresh token en `.env` cambió y ajusta

---

## ✅ Ventajas

| Antes | Ahora |
|-------|-------|
| ❌ Ejecutar `npm run oauth:drive-token` manualmente | ✅ Automático |
| ❌ Si expiraba =Error de autenticación | ✅ Se regenera automáticamente |
| ❌ Llamadas a Google cada vez | ✅ Reutiliza tokens válidos |
| ❌ Difícil detectar cambio de cuenta | ✅ Automático, sin configuración |

---

## 📁 Archivo `.oauth-tokens.json`

Se crea automáticamente en `Backend-ENI/` con este contenido:

```json
{
  "tokens": {
    "access_token": "ya29.a0...",
    "expiry_date": 1774925763992,
    "token_type": "Bearer",
    "refresh_token": "1//05ygOC..."
  },
  "refreshToken": "1//05ygOC...",
  "lastUpdated": "2026-03-30T10:30:45.123Z"
}
```

**⚠️ IMPORTANTE**: Este archivo:
- ✅ Se crea automáticamente (no tocarlo)
- ✅ Se incluye en `.gitignore` (seguro)
- ✅ Se actualiza cada vez que se refresca el token
- ❌ NO es sensible (tokens sin sentido sin el refresh token)

---

## 🔄 ¿Cómo funciona el cambio de cuenta?

### Antes (manual):
```bash
npm run oauth:drive-token  # Con SENA
# Copiar token manualmente
nano Backend-ENI/.env      # Pegar token
npm run dev
```

### Ahora (automático):
```bash
npm run oauth:drive-token  # Con SENA (genera nuevo refresh token)
# El script actualiza automáticamente .env
npm run dev                # ✅ Detecta cambio, ajusta tokens
```

¡**Sin copiar/pegar nada!**

---

## 📊 Qué ves en los logs

### Primera ejecución:
```
✅ Usando OAuth2 para Google Drive
💾 Access token almacenado para reutilización
```

### Siguientes ejecuciones (mientras el token sea válido):
```
♻️ Reutilizando access token almacenado (válido)
✅ Usando OAuth2 para Google Drive
```

### Si el token expiró:
```
✅ Usando OAuth2 para Google Drive
💾 Access token almacenado para reutilización
```

---

## 🛠️ Mantenimiento

### Limpiar tokens (si algo falla):
```bash
# Eliminar el archivo:
rm Backend-ENI/.oauth-tokens.json

# Próxima ejecución generará uno nuevo
npm run dev
```

### Verificar tokens guardados:
```bash
# Ver contenido (sin mostrar tokens sensibles):
cat Backend-ENI/.oauth-tokens.json | jq '.lastUpdated'
```

---

## ❓ Preguntas frecuentes

**P: ¿Se guardan las contraseñas en `.oauth-tokens.json`?**  
R: No, solo access tokens (temporales) y el refresh token (que ya está en `.env`).

**P: ¿Qué pasa si alguien accede al archivo `.oauth-tokens.json`?**  
R: Los tokens tienen poder limitado. El refresh token en `.env` es más importante. Ambos están en `.gitignore`.

**P: ¿Puedo eliminar `.oauth-tokens.json`?**  
R: Sí, se regenerará automáticamente en la próxima llamada a Google Drive (perderá ~1s de rendimiento).

**P: ¿Se sincroniza con git?**  
R: No, está en `.gitignore`. Se generan localmente para cada servidor.

---

## 🎯 Resumen

**Antes**: Manual, propenso a errores, llamadas innecesarias a Google  
**Ahora**: Automático, eficiente, maneja cambios de cuenta sin interacción

¡Eso es todo! El sistema funciona transparentemente en segundo plano. 🚀
