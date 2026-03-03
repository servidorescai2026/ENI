#!/usr/bin/env node
/**
 * Script para obtener/crear carpeta de evidencias en Google Drive
 * Uso: npm run google:setup
 */

import fs from "fs";
import path from "path";
import { google } from "googleapis";
import readline from "readline";

const credentialsPath = "./credenciales.json";

if (!fs.existsSync(credentialsPath)) {
  console.error("❌ ERROR: No se encontró credenciales.json en la raíz del Backend-ENI");
  process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));

const auth = new google.auth.GoogleAuth({
  keyFile: credentialsPath,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

async function createOrFindFolder() {
  console.log("\n📁 Buscando/creando carpeta de evidencias en Google Drive...\n");

  try {
    // Buscar si ya existe una carpeta llamada "Evidencias_ENI"
    const res = await drive.files.list({
      q: "name='Evidencias_ENI' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      spaces: "drive",
      fields: "files(id, name)",
      pageSize: 1,
    });

    if (res.data.files && res.data.files.length > 0) {
      const folderId = res.data.files[0].id;
      console.log("✅ Carpeta encontrada:");
      console.log(`   ID: ${folderId}`);
      console.log(`   Nombre: ${res.data.files[0].name}`);
      console.log("\n📝 Añade esto a tu .env:\n");
      console.log(`GOOGLE_DRIVE_FOLDER_ID=${folderId}\n`);
      return folderId;
    }

    // Si no existe, crearla
    console.log("Carpeta no encontrada. Creando 'Evidencias_ENI'...\n");

    const createRes = await drive.files.create({
      requestBody: {
        name: "Evidencias_ENI",
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id, name",
    });

    const folderId = createRes.data.id;
    console.log("✅ Carpeta creada exitosamente:");
    console.log(`   ID: ${folderId}`);
    console.log(`   Nombre: ${createRes.data.name}`);
    console.log("\n📝 Añade esto a tu .env:\n");
    console.log(`GOOGLE_DRIVE_FOLDER_ID=${folderId}\n`);

    // Auto-actualizar .env si existe
    const envPath = "./.env";
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, "utf8");
      envContent = envContent.replace(
        /GOOGLE_DRIVE_FOLDER_ID=.*/,
        `GOOGLE_DRIVE_FOLDER_ID=${folderId}`
      );
      fs.writeFileSync(envPath, envContent);
      console.log("✨ Archivo .env actualizado automáticamente!\n");
    }

    return folderId;
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createOrFindFolder();
