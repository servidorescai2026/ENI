# 📝 Guía para Cambiar Cuenta Google Drive

## Estado Actual ✅
**Cuenta actual:** Tu cuenta personal
**Método:** OAuth2 con auto-refresco automático (ver `AUTO_REFRESH_TOKENS.md`)

---

## 🔄 ¿Cómo cambiar a una cuenta del SENA?

Cambiar de cuenta es **super simple ahora**. El sistema se encarga automáticamente:

### Paso 1: Generar nuevo Refresh Token con la cuenta del SENA

1. **En tu terminal,** ejecuta:
```bash
npm run oauth:drive-token
```

2. **En el navegador que se abre:**
   - Cierra tu sesión de Google actual (si está abierta)
   - Inicia sesión con la **cuenta del SENA**
   - Autoriza el acceso a Google Drive
   - El script generará automáticamente el nuevo token Y actualizará el `.env`

### Paso 2: ✨ ¡Eso es todo!

El script hace todo automáticamente:
- ✅ Genera el nuevo refresh token
- ✅ Actualiza `.env`
- ✅ Detecta el cambio en `.oauth-tokens.json`

**No necesitas hacer nada más.**

### Paso 3 (Opcional): Reinicia el servidor

```bash
npm run dev
```

---

## 🤖 ¿Qué cambia automáticamente?

| Elemento | ¿Cambia? | Detalles |
|----------|----------|---------|
| **GOOGLE_OAUTH_REFRESH_TOKEN** | ✅ Automático | El script lo actualiza |
| GOOGLE_OAUTH_CLIENT_ID | ❌ NO | Es de la app, no del usuario |
| GOOGLE_OAUTH_CLIENT_SECRET | ❌ NO | Es de la app, no del usuario |
| GOOGLE_OAUTH_REDIRECT_URI | ❌ NO | Es de la app |
| `.oauth-tokens.json` | ✅ Automático | Se recalcula con nuevo token |
| googleDrive.js | ❌ NO | Sin cambios necesarios |

---

## 📊 Flujo automático

```
1. npm run oauth:drive-token (con cuenta SENA)
                ⬇
2. Script abre navegador → Autorizas con SENA
                ⬇
3. Script obtiene refresh token
                ⬇
4. Script actualiza .env automáticamente
                ⬇
5. Script detecta cambio en tokenManager
                ⬇
6. Próxima vez que subas archivo: ✅ Usa cuenta SENA
```

---

## 🔐 Seguridad

- El refresh token se guarda en `.env` (como siempre)
- Los access tokens se guardan en `.oauth-tokens.json`
- Ambos están en `.gitignore` ✅
- Si alguien accede al servidor, los tokens están protegidos

---

## ❌ Si algo falla

**Error: "invalid_grant"**
- El refresh token expiró (muy raro, después de meses)
- Solución: Vuelve a ejecutar `npm run oauth:drive-token`

**Error: "Google Drive no disponible"**
- El `.oauth-tokens.json` está corrompido
- Solución: Elimínalo con `rm Backend-ENI/.oauth-tokens.json` y reinicia

**Cambié de cuenta pero aún usa la antigua**
- El script no corrigió el `.env`
- Solución: Verifica que `.env` tenga el nuevo refresh token

---

## 💡 Próximas veces

Próxima vez que cambies de cuenta:
```bash
npm run oauth:drive-token  # Con otra cuenta
# ¡El sistema se encarga del resto! 🎉
```

Ver detalles técnicos: [AUTO_REFRESH_TOKENS.md](AUTO_REFRESH_TOKENS.md)

