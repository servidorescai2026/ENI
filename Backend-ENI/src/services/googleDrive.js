import { google } from "googleapis";
import fs from "fs";
import dotenv from "dotenv";
import { Readable } from "stream";

dotenv.config();

/**
 * Servicio de Google Drive con soporte para credenciales en variables de entorno (Vercel)
 * y archivo de credenciales tradicional (desarrollo local).
 */

function hasServiceAccountConfig() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return true;
  }
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyPath && fs.existsSync(keyPath)) {
    return true;
  }
  return false;
}

function hasOAuthConfig() {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    (process.env.GOOGLE_OAUTH_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN)
  );
}

function createDriveAuth() {
  // 1. Intentar OAuth2 primero
  if (hasOAuthConfig()) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_OAUTH_CLIENT_ID,
        process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        process.env.GOOGLE_OAUTH_REDIRECT_URI || "http://localhost:3000/auth/callback"
      );

      oauth2Client.setCredentials({
        refresh_token:
          process.env.GOOGLE_OAUTH_REFRESH_TOKEN ||
          process.env.GOOGLE_REFRESH_TOKEN,
      });

      console.log("✅ Usando OAuth2 para Google Drive");
      return oauth2Client;
    } catch (e) {
      console.warn("⚠️ Error inicializando OAuth2:", e.message);
    }
  }

  // 2. Intentar Service Account desde variable de entorno (Vercel)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      console.log("✅ Usando Service Account (desde ENV) para Google Drive");
      return new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/drive"],
      });
    } catch (e) {
      console.warn("⚠️ Error parseando GOOGLE_SERVICE_ACCOUNT_KEY:", e.message);
    }
  }

  // 3. Fallback a Service Account desde archivo
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    try {
      console.log("✅ Usando Service Account (desde archivo) para Google Drive");
      return new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ["https://www.googleapis.com/auth/drive"],
      });
    } catch (e) {
      console.warn("⚠️ Error con GOOGLE_APPLICATION_CREDENTIALS:", e.message);
    }
  }

  return null;
}

export async function uploadEvidenciasToDrive(archivos, nombreUsuario, options = {}) {
  if (!archivos || !Array.isArray(archivos) || archivos.length === 0) {
    throw new Error("No hay archivos para subir a Google Drive");
  }

  const auth = createDriveAuth();
  if (!auth) {
    throw new Error(
      "Credenciales de Google Drive no configuradas en variables de entorno."
    );
  }

  const drive = google.drive({ version: "v3", auth });
  const mainFolderName = options.mainFolderName || "Evidencias_ENI";
  let mainFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;

  if (!mainFolderId) {
    try {
      const mainRes = await drive.files.list({
        q: `name='${mainFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        spaces: "drive",
        fields: "files(id)",
        pageSize: 1,
      });

      if (mainRes.data.files && mainRes.data.files.length > 0) {
        mainFolderId = mainRes.data.files[0].id;
      } else {
        const createRes = await drive.files.create({
          requestBody: {
            name: mainFolderName,
            mimeType: "application/vnd.google-apps.folder",
          },
          fields: "id",
        });
        mainFolderId = createRes.data.id;
      }
    } catch (folderErr) {
      console.warn("⚠️ No se pudo obtener carpeta principal, usando raíz:", folderErr.message);
      mainFolderId = null;
    }
  }

  const userFolderName =
    options.userFolderName || `${nombreUsuario.replace(/\s+/g, "_")}_${Date.now()}`;
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
  } catch (userFolderErr) {
    console.warn("⚠️ No se pudo crear carpeta de usuario, usando fallback:", userFolderErr.message);
    userFolderId = mainFolderId;
  }

  const urls = [];

  for (const archivo of archivos) {
    try {
      const buffer = archivo.buffer;
      if (!buffer) {
        throw new Error(`Buffer no disponible para archivo ${archivo.originalname}`);
      }

      const stream = Readable.from(buffer);
      const fileRes = await drive.files.create(
        {
          requestBody: {
            name: archivo.originalname || `archivo_${Date.now()}.pdf`,
            ...(userFolderId && { parents: [userFolderId] }),
          },
          media: {
            mimeType: archivo.mimetype || "application/octet-stream",
            body: stream,
          },
          fields: "id, webViewLink, webContentLink",
        },
        { timeout: 60000 }
      );

      const fileId = fileRes.data.id;
      const webViewLink =
        fileRes.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

      try {
        await drive.permissions.create({
          fileId,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
        });
      } catch (permErr) {
        console.warn("⚠️ Aviso al asignar permiso público:", permErr.message);
      }

      urls.push({
        url: `${webViewLink}?usp=drive_link`,
        fileId,
        nombre: archivo.originalname,
      });
    } catch (fileErr) {
      console.error(`❌ Error subiendo archivo ${archivo.originalname}:`, fileErr.message);
    }
  }

  if (urls.length === 0) {
    throw new Error("No se pudo subir ningún archivo a Google Drive");
  }

  const folderLink = userFolderId
    ? `https://drive.google.com/drive/folders/${userFolderId}`
    : null;

  return { folderLink, files: urls };
}

export function checkDriveConfig() {
  return {
    hasServiceAccount: hasServiceAccountConfig(),
    hasOAuth: hasOAuthConfig(),
    hasFolderId: Boolean(process.env.GOOGLE_DRIVE_FOLDER_ID),
    isConfigured: hasServiceAccountConfig() || hasOAuthConfig(),
  };
}
