const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const cors = require("cors");
const cardRoutes = require("./routes/Card"); // ✅ importa le rotte
const authRoutes = require("./routes/auth"); // ✅ importa le rotte
const path = require("path");
const uploadFolderRecursive = require("./upload-folders");
// salva il file temporaneamente
dotenv.config();

const app = express();

// app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 🔗 Monta il router sotto /cards
app.use("/cards", cardRoutes);
app.use("/auth", authRoutes);
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "public/index.html"));
// });
// ✅ Connessione a MongoDB
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connesso"))
  .catch((err) => console.error("❌ Errore MongoDB:", err));

// Avvia il server
const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
  console.log(`🚀 Server in ascolto su http://localhost:${PORT}`);
});
// (async () => {
//   try {
//     const localFolderPath = path.resolve(__dirname, "assets/card-img");
//     await uploadFolderRecursive(localFolderPath);
//     console.log("🎉 Upload completato con successo!");
//   } catch (err) {
//     console.error("❌ Errore durante l'upload:", err.message);
//   }
// })();
