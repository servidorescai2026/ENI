import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_FILE = path.join(__dirname, "../../.oauth-tokens.json");

/**
 * Manager para almacenar y refrescar tokens OAuth automáticamente
 * Evita regenerar tokens constantemente salvándolos en un archivo
 */

function ensureTokensFile() {
  if (!fs.existsSync(TOKENS_FILE)) {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify({ tokens: {}, refreshToken: null }, null, 2));
  }
}

export function readStoredTokens() {
  try {
    ensureTokensFile();
    const content = fs.readFileSync(TOKENS_FILE, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    console.warn("⚠️ No se pudo leer tokens almacenados:", e.message);
    return { tokens: {}, refreshToken: null };
  }
}

export function writeStoredTokens(data) {
  try {
    ensureTokensFile();
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn("⚠️ No se pudo guardar tokens:", e.message);
  }
}

export function updateStoredTokens(tokens) {
  const data = readStoredTokens();
  data.tokens = tokens;
  data.lastUpdated = new Date().toISOString();
  writeStoredTokens(data);
}

export function setStoredRefreshToken(refreshToken) {
  const data = readStoredTokens();
  data.refreshToken = refreshToken;
  data.lastUpdated = new Date().toISOString();
  writeStoredTokens(data);
}

export function getStoredRefreshToken() {
  const data = readStoredTokens();
  return data.refreshToken || null;
}

export function hasValidTokens() {
  const data = readStoredTokens();
  const tokens = data.tokens || {};
  
  if (!tokens.access_token || !tokens.expiry_date) {
    return false;
  }

  // Verificar si el token expira en menos de 5 minutos
  const expiryTime = new Date(tokens.expiry_date).getTime();
  const now = new Date().getTime();
  const bufferMs = 5 * 60 * 1000; // 5 minutos de buffer
  
  return expiryTime - now > bufferMs;
}

export function clearStoredTokens() {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      fs.unlinkSync(TOKENS_FILE);
    }
  } catch (e) {
    console.warn("⚠️ Error al limpiar tokens:", e.message);
  }
}
