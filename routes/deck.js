import express from "express";
import db from "../db.js"; // importa il tuo client PostgreSQL
const router = express.Router();

// SQL queries
const selectUsername = `SELECT id, deck_id FROM users WHERE username = $1`;
const findDeck = `SELECT * FROM decks WHERE id = $1`;

const selecteRouterQuery = `
  SELECT d.decks
  FROM users u
  JOIN decks d ON u.id = d.user_id
  WHERE u.username = $1
`;

const updateQuery = `
  UPDATE decks
  SET decks = $1
  WHERE user_id = $2
  RETURNING *
`;

const deleteQuery = `DELETE FROM decks WHERE user_id = $1 RETURNING *`;

// Validatore (base)
function validateDecks(decks) {
  if (!Array.isArray(decks) || decks.length > 5) {
    throw new Error("Devi fornire massimo 5 mazzi");
  }

  for (const [i, deck] of decks.entries()) {
    if (typeof deck !== "object" || deck === null)
      throw new Error(`Mazzo ${i + 1} non valido`);
    if (typeof deck.isSelected !== "boolean")
      throw new Error(`Mazzo ${i + 1} manca isSelected`);
    if (typeof deck.frame !== "string")
      throw new Error(`Mazzo ${i + 1} manca frame`);
    if (!Array.isArray(deck.cards))
      throw new Error(`Mazzo ${i + 1} manca cards`);
    if (deck.cards.length > 30)
      throw new Error(`Mazzo ${i + 1} ha troppe carte`);
  }
}

// PUT /decks/:username → aggiorna i mazzi di un utente
router.put("/:username", async (req, res) => {
  const { username } = req.params;
  const { decks } = req.body;

  try {
    validateDecks(decks);

    const userRes = await db.query(selectUsername, [username]);
    if (!userRes.rows.length) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    const userId = userRes.rows[0].id;

    const result = await db.query(updateQuery, [JSON.stringify(decks), userId]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Deck non trovato per questo utente" });
    }

    res.json({ success: true, updated: result.rows[0] });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /decks/:username → elimina i mazzi associati
router.delete("/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const userRes = await db.query(selectUsername, [username]);
    if (!userRes.rows.length) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    const userId = userRes.rows[0].id;
    const result = await db.query(deleteQuery, [userId]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Deck non trovato per questo utente" });
    }

    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Errore interno", detail: err.message });
  }
});

// GET /decks/selected/:username → mazzo con isSelected: true
router.get("/selected/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const result = await db.query(selecteRouterQuery, [username]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Deck non trovato per questo username" });
    }

    const decks = result.rows[0].decks;
    const selected = decks.find((deck) => deck.isSelected === true);

    if (!selected) {
      return res.status(404).json({ error: "Nessun mazzo selezionato" });
    }

    res.json(selected);
  } catch (err) {
    res.status(500).json({ error: "Errore interno" });
  }
});

// GET /decks/init/:username → inizializza se mancante
router.get("/init/:username", async (req, res) => {
  const { username } = req.params;

  try {
    // 1. Trova l'utente
    const userRes = await db.query(selectUsername, [username]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    const user = userRes.rows[0];

    // 2. Se ha già deck_id, recupera e ritorna
    if (user.deck_id) {
      const deckRes = await db.query(findDeck, [user.deck_id]);
      if (deckRes.rows.length) {
        return res.json(deckRes.rows[0]);
      }
    }

    // 3. Altrimenti, crea il record dei decks
    const emptyDecks = Array.from({ length: 5 }).map((_, i) => ({
      isSelected: i === 0,
      frame: "",
      cards: [],
    }));

    const insertDeckRes = await db.query(
      `INSERT INTO decks (user_id, decks) VALUES ($1, $2) RETURNING id, decks`,
      [user.id, JSON.stringify(emptyDecks)]
    );

    const newDeckId = insertDeckRes.rows[0].id;

    // 4. Aggiorna users.deck_id
    await db.query(`UPDATE users SET deck_id = $1 WHERE id = $2`, [
      newDeckId,
      user.id,
    ]);

    res.json(insertDeckRes.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Errore interno", detail: err.message });
  }
});

// 🔹 READ ALL - GET /cards
router.get("/allcard", async (req, res) => {
  try {
    const cards = await Card.find();
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero carte" });
  }
});
export default router;
