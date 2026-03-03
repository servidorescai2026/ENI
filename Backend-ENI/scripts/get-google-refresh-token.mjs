#!/usr/bin/env node
/**
 * Script para obtener Google OAuth Refresh Token
 * Uso: npm run oauth:drive-token
 * 
 * Este script abre el navegador para que autorices la aplicación,
 * y luego te devuelve el refresh token para guardar en .env
 */

import { google } from "googleapis";
import http from "http";
import url from "url";
import open from "open";
import readline from "readline";
import fs from "fs";
import dotenv from "dotenv";

// Cargar .env ANTES de leer las variables
dotenv.config();

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || "YOUR_CLIENT_ID";
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || "YOUR_CLIENT_SECRET";
const REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI || "http://localhost:3000/auth/callback";

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = ["https://www.googleapis.com/auth/drive"];

async function getRefreshToken() {
  console.log("\n🔐 Google OAuth Setup para Google Drive\n");

  if (CLIENT_ID === "YOUR_CLIENT_ID") {
    console.error("❌ ERROR: Configura GOOGLE_OAUTH_CLIENT_ID en .env primero");
    process.exit(1);
  }

  if (CLIENT_SECRET === "YOUR_CLIENT_SECRET") {
    console.error("❌ ERROR: Configura GOOGLE_OAUTH_CLIENT_SECRET en .env primero");
    process.exit(1);
  }

  // Generar authUrl
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // Fuerza a Google a pedir consentimiento y emitir refresh_token
  });

  console.log("📱 Abriendo navegador para autorizar...");
  console.log(`🔗 Si el navegador no se abre, ve a: ${authUrl}\n`);

  // Abrir navegador
  try {
    await open(authUrl);
  } catch (e) {
    console.warn("⚠️ No se pudo abrir el navegador automáticamente");
  }

  // Crear servidor para capturar el código
  const server = http.createServer(async (req, res) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      const queryUrl = url.parse(req.url, true);
      const code = queryUrl.query.code;

      if (!code) {
        res.end("❌ No se recibió código de autorización. Intenta de nuevo.");
        return;
      }

      console.log(`\n✅ Código recibido: ${code.substring(0, 20)}...`);

      // Intercambiar código por tokens
      let result;
      try {
        result = await oauth2Client.getToken(code);
      } catch (tokenError) {
        console.error("❌ Error al intercambiar código por token:", tokenError.message);
        throw tokenError;
      }

      const { tokens } = result || {};

      // Debug: mostrar qué se recibió
      console.log("\n🔍 Respuesta de Google:", {
        access_token: tokens?.access_token ? "✅ Presente" : "❌ Faltante",
        refresh_token: tokens?.refresh_token ? "✅ Presente" : "❌ Faltante",
        token_type: tokens?.token_type,
        expiry_date: tokens?.expiry_date,
      });

      // Validar que se recibió el refresh_token
      if (!tokens || !tokens.refresh_token) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <title>Error de autorización</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #f44336; font-size: 20px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="error">❌ Error: No se recibió refresh token</div>
            <p>Esto ocurre si ya autorizaste antes. Intenta:</p>
            <p>1. Ve a: <a href="https://myaccount.google.com/permissions" target="_blank">Google Permissions</a></p>
            <p>2. Revoca "backend" de tus aplicaciones conectadas</p>
            <p>3. Vuelve a ejecutar: npm run oauth:drive-token</p>
          </body>
          </html>
        `);
        server.close();
        console.error("❌ No se recibió refresh_token. Necesitas revocar permisos previos.");
        console.error("   Ve a: https://myaccount.google.com/permissions");
        console.error("   Busca 'backend' y revócalo");
        console.error("   Luego ejecuta: npm run oauth:drive-token");
        process.exit(1);
      }

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Autorización completada</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #4caf50; font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="success">✅ ¡Autorización exitosa!</div>
          <p>El refresh token se ha guardado. Puedes cerrar esta ventana.</p>
        </body>
        </html>
      `);

      console.log("\n🎉 Autorización exitosa!");
      console.log("\n📋 Credenciales obtenidas:");
      console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);

      // Actualizar .env automáticamente si existe; si no existe la variable, agregarla
      if (fs.existsSync(".env")) {
        let envContent = fs.readFileSync(".env", "utf8");
        if (/^GOOGLE_OAUTH_REFRESH_TOKEN=.*/m.test(envContent)) {
          envContent = envContent.replace(
            /^GOOGLE_OAUTH_REFRESH_TOKEN=.*/m,
            `GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`
          );
        } else {
          envContent = `${envContent.trimEnd()}\nGOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}\n`;
        }
        fs.writeFileSync(".env", envContent);
        console.log("\n✅ Archivo .env actualizado automáticamente con el refresh token");
      } else {
        console.log("\n⚠️ No existe .env. Crea uno y agrega esta línea:");
        console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
      }

      server.close();
      console.log("\n✨ Listo para usar Google Drive. Reinicia el servidor con: npm run dev\n");
      process.exit(0);
    } catch (error) {
      console.error("❌ Error durante la autorización:", error.message);
      res.writeHead(500);
      res.end("Error: " + error.message);
      server.close();
      process.exit(1);
    }
  });

  server.listen(3000, () => {
    console.log("⏳ Esperando autorización...\n");
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error("❌ Puerto 3000 ya está en uso");
      process.exit(1);
    }
  });

  // Timeout después de 5 minutos
  setTimeout(() => {
    console.error("❌ Timeout: no se recibió autorización en 5 minutos");
    server.close();
    process.exit(1);
  }, 5 * 60 * 1000);
}

getRefreshToken().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
