import { google } from "googleapis";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Readable } from "stream";

dotenv.config();

/** 
 * Servicio de Google Drive con soporte para autenticación por Service Account y OAuth2
 */

function hasServiceAccountConfig() {
  try {
    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (keyPath && fs.existsSync(keyPath)) {
      return true;
    }
  } catch (e) {
    // fall through
  }
  return false;
}

function hasOAuthConfig() {
  return (
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  );
}

function createDriveAuth() {
  // Intenta OAuth2 primero (mejor para Service Accounts sin cuota)
  if (hasOAuthConfig()) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_OAUTH_CLIENT_ID,
        process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        process.env.GOOGLE_OAUTH_REDIRECT_URI || "http://localhost:3000/auth/callback"
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
      });

      console.log("✅ Usando OAuth2 para Google Drive");
      return oauth2Client;
    } catch (e) {
      console.warn("⚠️ OAuth2 no disponible:", e.message);
    }
  }

  // Fallback a Service Account
  if (hasServiceAccountConfig()) {
    try {
      console.log("✅ Usando Service Account para Google Drive");
      return new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ["https://www.googleapis.com/auth/drive"],
      });
    } catch (e) {
      console.warn("⚠️ Service Account no disponible:", e.message);
    }
  }

  return null;
}

/**
 * Carga archivos a Google Drive
 * @param {File[]} archivos - Array de archivos de multer
 * @param {string} nombreUsuario - Nombre del usuario para organizar
 * @returns {Promise<{folderLink: string | null, files: {url: string, fileId: string}[]}>} Enlace de carpeta y URLs públicas
 * @throws {Error} Si hay error de configuración o subida
 */
export async function uploadEvidenciasToDrive(archivos, nombreUsuario) {
  if (!archivos || !Array.isArray(archivos)) {
    throw new Error("No hay archivos para subir");
  }

  const auth = createDriveAuth();
  if (!auth) {
    throw new Error("Credenciales de Google Drive no configuradas (falta GOOGLE_OAUTH_REFRESH_TOKEN o GOOGLE_APPLICATION_CREDENTIALS)");
  }

  const drive = google.drive({ version: "v3", auth });
  
  // Obtener o crear carpeta principal "Evidencias_ENI"
  let mainFolderId;
  try {
    const mainRes = await drive.files.list({
      q: "name='Evidencias_ENI' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      spaces: "drive",
      fields: "files(id)",
      pageSize: 1,
    });

    if (mainRes.data.files && mainRes.data.files.length > 0) {
      mainFolderId = mainRes.data.files[0].id;
      console.log(`✅ Carpeta Evidencias_ENI encontrada: ${mainFolderId}`);
    } else {
      // Crear carpeta si no existe
      const createRes = await drive.files.create({
        requestBody: {
          name: "Evidencias_ENI",
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
      });
      mainFolderId = createRes.data.id;
      console.log(`✅ Carpeta Evidencias_ENI creada: ${mainFolderId}`);
    }
  } catch (folderErr) {
    console.warn("⚠️ No se pudo usar carpeta principal, usando raíz de Drive", folderErr.message);
    mainFolderId = null; // Usar raíz
  }

  // Crear carpeta del usuario dentro de la carpeta principal
  let userFolderId = mainFolderId;
  const userFolderName = `${nombreUsuario}_${Date.now()}`;
  
  try {
    const folderRes = await drive.files.create({
      requestBody: {
        name: userFolderName,
        mimeType: "application/vnd.google-apps.folder",
        ...(mainFolderId && { parents: [mainFolderId] }),
      },
      fields: "id",
    });
    userFolderId = folderRes.data.id;
    console.log(`✅ Carpeta de usuario creada: ${userFolderName}`);
  } catch (folderErr) {
    console.warn("⚠️ No se pudo crear carpeta de usuario, usando raíz", folderErr.message);
    userFolderId = mainFolderId || null;
  }

  const urls = [];

  // Subir cada archivo
  for (const archivo of archivos) {
    try {
      // Crear stream desde el buffer del archivo
      const stream = Readable.from([archivo.buffer]);

      const fileRes = await drive.files.create(
        {
          requestBody: {
            name: archivo.originalname || `archivo_${Date.now()}.pdf`,
            ...(userFolderId && { parents: [userFolderId] }),
          },
          media: {
            mimeType: archivo.mimetype,
            body: stream,
          },
          fields: "id, webViewLink, webContentLink",
        },
        { timeout: 60000 }
      );

      const fileId = fileRes.data.id;
      const webViewLink = fileRes.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

      // Hacer el archivo público (opcional)
      try {
        await drive.permissions.create({
          fileId: fileId,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
        });
      } catch (permErr) {
        console.warn("⚠️ No se pudo hacer público el archivo:", permErr.message);
      }

      urls.push({
        url: `${webViewLink}?usp=drive_link`,
        fileId: fileId,
      });

      console.log(`✅ Archivo subido a Drive: ${archivo.originalname}`);
    } catch (fileErr) {
      console.error(`❌ Error subiendo archivo a Drive: ${archivo.originalname}`, fileErr.message);
      // Continúa con el siguiente archivo en lugar de fallar completamente
    }
  }

  if (urls.length === 0) {
    throw new Error("No se pudo subir ningún archivo a Google Drive");
  }

  const folderLink = userFolderId ? `https://drive.google.com/drive/folders/${userFolderId}` : null;
  return { folderLink, files: urls };
}

/**
 * Verifica la configuración de Google Drive
 * @returns {Object} Estado de configuración
 */
export function checkDriveConfig() {
  return {
    hasServiceAccount: hasServiceAccountConfig(),
    hasOAuth: hasOAuthConfig(),
    hasFolderId: Boolean(process.env.GOOGLE_DRIVE_FOLDER_ID),
    isConfigured: hasServiceAccountConfig() || hasOAuthConfig(),
  };
}
