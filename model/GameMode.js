// GameModel.js

export function createEmptyGame() {
  return {
    id: "",
    name: "",
    status: "waiting",
    teams: [],
    currentTurnIndex: 0,
    currentPlayerId: null,
    allPlayers: [],
    crystals: {},
    maxCrystals: {},
    health: {},
    decks: {},
    hands: {},
    boards: {},
    usernames: {},
  };
}
