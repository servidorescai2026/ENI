import { google } from "googleapis";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Readable } from "stream";

dotenv.config();

/** 
 * Servicio de Google Drive con soporte para autenticación por Service Account y OAuth2
 */

function normalizeEnvValue(value) {
  if (!value || typeof value !== "string") return "";
  return value.trim().replace(/^['\"]|['\"]$/g, "");
}

function sanitizeFolderName(value, fallback) {
  const cleaned = String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ");

  return cleaned || fallback;
}

function getOAuthEnv() {
  return {
    clientId: normalizeEnvValue(process.env.GOOGLE_OAUTH_CLIENT_ID),
    clientSecret: normalizeEnvValue(process.env.GOOGLE_OAUTH_CLIENT_SECRET),
    refreshToken: normalizeEnvValue(process.env.GOOGLE_OAUTH_REFRESH_TOKEN),
    redirectUri:
      normalizeEnvValue(process.env.GOOGLE_OAUTH_REDIRECT_URI) ||
      "http://localhost:3000/auth/callback",
  };
}

function isInvalidGrantError(error) {
  const message = error?.message || "";
  const apiMessage = error?.response?.data?.error || "";
  return String(message).includes("invalid_grant") || String(apiMessage).includes("invalid_grant");
}

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
  const { clientId, clientSecret, refreshToken } = getOAuthEnv();
  return (
    Boolean(clientId) &&
    Boolean(clientSecret) &&
    Boolean(refreshToken)
  );
}

function createOAuthClient() {
  const { clientId, clientSecret, refreshToken, redirectUri } = getOAuthEnv();

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

function createServiceAccountAuth() {
  return new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
}

async function createDriveClient() {
  // Intenta OAuth2 primero (mejor para Service Accounts sin cuota)
  if (hasOAuthConfig()) {
    try {
      const oauth2Client = createOAuthClient();
      await oauth2Client.getAccessToken();

      console.log("✅ Usando OAuth2 para Google Drive");
      return google.drive({ version: "v3", auth: oauth2Client });
    } catch (e) {
      if (isInvalidGrantError(e)) {
        console.warn(
          "⚠️ OAuth2 no disponible: refresh token inválido/revocado (invalid_grant)."
        );
      } else {
        console.warn("⚠️ OAuth2 no disponible:", e.message);
      }
    }
  }

  // Fallback a Service Account
  if (hasServiceAccountConfig()) {
    try {
      console.log("✅ Usando Service Account para Google Drive");
      const auth = createServiceAccountAuth();
      return google.drive({ version: "v3", auth });
    } catch (e) {
      console.warn("⚠️ Service Account no disponible:", e.message);
    }
  }

  throw new Error(
    "Google Drive no configurado correctamente. Si usas OAuth2, regenera GOOGLE_OAUTH_REFRESH_TOKEN con 'npm run oauth:drive-token'."
  );
}

/**
 * Carga archivos a Google Drive
 * @param {File[]} archivos - Array de archivos de multer
 * @param {string} nombreUsuario - Nombre del usuario para organizar
 * @returns {Promise<{folderLink: string | null, files: {url: string, fileId: string}[]}>} Enlace de carpeta y URLs públicas
 * @throws {Error} Si hay error de configuración o subida
 */
export async function uploadEvidenciasToDrive(archivos, nombreUsuario, options = {}) {
  if (!archivos || !Array.isArray(archivos)) {
    throw new Error("No hay archivos para subir");
  }

  const drive = await createDriveClient();
  const mainFolderName = sanitizeFolderName(options.mainFolderName, "Evidencias_ENI");
  const defaultUserFolderName = `${nombreUsuario}_${Date.now()}`;
  const userFolderName = sanitizeFolderName(options.userFolderName, defaultUserFolderName);
  
  // Obtener o crear carpeta principal "Evidencias_ENI"
  let mainFolderId;
  try {
    const mainRes = await drive.files.list({
      q: `name='${mainFolderName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
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
          name: mainFolderName,
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
      });
      mainFolderId = createRes.data.id;
      console.log(`✅ Carpeta ${mainFolderName} creada: ${mainFolderId}`);
    }
  } catch (folderErr) {
    console.warn("⚠️ No se pudo usar carpeta principal, usando raíz de Drive", folderErr.message);
    mainFolderId = null; // Usar raíz
  }

  // Crear carpeta del usuario dentro de la carpeta principal
  let userFolderId = mainFolderId;
  
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
