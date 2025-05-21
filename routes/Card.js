const express = require("express");
const Card = require("../model/CardModel");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
// 🔹 CREATE - POST /cards
router.post("/", async (req, res) => {
  try {
    const card = new Card(req.body);
    await card.save();
    console.log(card);
    res.status(201).json(card);
  } catch (err) {
    res
      .status(400)
      .json({ error: "Errore nella creazione", details: err.message });
  }
});

// 🔹 READ ALL - GET /cards
router.get("/", async (req, res) => {
  try {
    const cards = await Card.find();
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero carte" });
  }
});

// 🔹 READ ONE - GET /cards/:id
router.get("/:id", async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ error: "Carta non trovata" });
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero carta" });
  }
});

// 🔹 UPDATE - PUT /cards/:id
router.put("/:id", async (req, res) => {
  try {
    console.log("PUT /cards/:id", req.params);

    const { id } = req.params;

    // Verifica coerenza tra URL e body
    if (req.body._id && req.body._id !== id) {
      return res.status(400).json({ error: "_id non corrisponde all'URL" });
    }

    // Forza coerenza
    req.body._id = id;

    // Verifica che la carta esista
    const cardExists = await Card.findById(id);
    if (!cardExists) {
      return res.status(404).json({ error: "Carta non trovata" });
    }

    // Sostituzione completa
    await Card.replaceOne({ _id: id }, req.body);

    // Ritorna la versione aggiornata
    const updated = await Card.findById(id);
    res.json(updated);
  } catch (err) {
    console.error("Errore PUT /cards/:id", err);
    res.status(400).json({
      error: "Errore nella sostituzione",
      details: err.message,
    });
  }
});

// 🔹 DELETE - DELETE /cards/:id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Card.findOneAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Carta non trovata" });
    res.json({ message: "Carta eliminata con successo" });
  } catch (err) {
    res.status(500).json({ error: "Errore nell'eliminazione" });
  }
});

router.post(
  "/upload-and-update",
  upload.single("cardsFile"),
  async (req, res) => {
    try {
      const fs = require("fs");

      const rawData = fs.readFileSync(req.file.path, "utf-8");
      const updatedCards = JSON.parse(rawData);
      let updatedCount = 0;

      for (const card of updatedCards) {
        const result = await Card.updateOne(
          { id: card.id },
          {
            $set: {
              attack: card.attack,
              defense: card.defense,
              cost: card.cost,
              description: card.description,
              abilities: card.abilities || [],
              effect: card.effect || null,
            },
          },
          { upsert: false }
        );
        if (result.modifiedCount > 0) updatedCount++;
      }

      // Rimuovi file temporaneo
      fs.unlinkSync(req.file.path);

      res.send(
        `<h3>${updatedCount} carte aggiornate dal file caricato.</h3><a href="/">Torna al pannello</a>`
      );
    } catch (err) {
      console.error("Errore aggiornamento:", err);
      res
        .status(500)
        .send(`<h3>Errore: ${err.message}</h3><a href="/">Torna</a>`);
    }
  }
);

module.exports = router;
