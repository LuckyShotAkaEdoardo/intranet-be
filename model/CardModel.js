const mongoose = require("mongoose");
const { Schema } = mongoose;

const cardSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  type: { type: String, enum: ["HERO", "MAGIC"] },
  attack: Number,
  defense: Number,
  cost: Number,
  image: String,
  description: String,
  abilities: { type: Schema.Types.Mixed }, // può essere array, oggetto, ecc.
  effect: { type: Schema.Types.Mixed }, // completamente libero
});

module.exports = mongoose.model("Card", cardSchema);
