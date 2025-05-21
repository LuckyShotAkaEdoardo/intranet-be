const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = "sw4img";

async function uploadFolderRecursive(localBasePath, subfolder = "") {
  console.log(supabase);
  const fullPath = path.join(localBasePath, subfolder);
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });

  for (const entry of entries) {
    const relativePath = path.join(subfolder, entry.name);
    const absolutePath = path.join(localBasePath, relativePath);

    if (entry.isDirectory()) {
      await uploadFolderRecursive(localBasePath, relativePath);
    } else if (!entry.name.startsWith(".") && entry.name !== "Thumbs.db") {
      const fileBuffer = fs.readFileSync(absolutePath);
      const storagePath = `card-img/${relativePath.replace(/\\/g, "/")}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: getMimeType(entry.name),
          cacheControl: "public, max-age=31536000, immutable",
          upsert: true,
        });

      if (error) {
        console.error(`❌ Errore su ${storagePath}:`, error.message);
      } else {
        console.log(`✅ Caricato: ${storagePath}`);
      }
    }
  }
}

function getMimeType(fileName) {
  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg"))
    return "image/jpeg";
  if (fileName.endsWith(".png")) return "image/png";
  if (fileName.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

module.exports = uploadFolderRecursive;
