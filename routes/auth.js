const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db.js");

const router = express.Router();

// 🔐 Login
router.post("/login", async (req, res) => {
  console.log(req.body);
  const { username, password } = req.body;
  console.log(username, password);
  try {
    const result = await pool.query(
      "SELECT * FROM admin.users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Utente non trovato" });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Password errata" });
    }

    if (user.must_change_password) {
      return res.status(200).json({
        message: "Devi cambiare la password",
        forceChange: true,
        userId: user.id,
      });
    }

    res.status(200).json({ message: "Login OK", userId: user.id });
  } catch (err) {
    console.error("Errore login:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

// 🔐 Cambio password
router.post("/change-password", async (req, res) => {
  const { username, newPassword } = req.body;

  try {
    const newHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `
      UPDATE admin.users 
      SET password_hash = $1, must_change_password = false
      WHERE username = $2
    `,
      [newHash, username]
    );

    res.status(200).json({ message: "Password cambiata con successo" });
  } catch (err) {
    console.error("Errore cambio password:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

module.exports = router;
