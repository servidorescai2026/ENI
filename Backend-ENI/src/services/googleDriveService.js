import { google } from "googleapis";
import path from "path";
import fs from "fs";

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(process.cwd(), "src/aesthetic-joy-487901-t3-b468e2860d9c.json"),
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({
  version: "v3",
  auth,
});

export async function uploadFile(file) {
  const response = await drive.files.create({
    requestBody: {
      name: file.originalname,
      mimeType: file.mimetype,
    },
    media: {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path),
    },
  });

  return response.data;
}
