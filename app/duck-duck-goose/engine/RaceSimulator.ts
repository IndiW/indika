export type RaceWinner = 'player' | 'npc' | null;

// Both players need CLICKS_TO_WIN clicks to finish. NPC clicks at a sampled rate.
const CLICKS_TO_WIN = 24;

function sampleNpcRate(): number {
  const r = Math.random();
  if (r < 0.25) return 3 + Math.random() * 1.5;  // easy:  3–4.5 clicks/sec
  if (r < 0.85) return 5 + Math.random();          // fair:  5–6 clicks/sec
  return 10 + Math.random() * 5;                    // hard: 10–15 clicks/sec
}

export class RaceSimulator {
  playerProgress = 0;
  npcProgress = 0;
  winner: RaceWinner = null;

  private npcRate: number;
  private playerRate: number | null; // null = click-controlled

  constructor(_playerArc: number, _npcArc: number, autoPlayer = false) {
    this.npcRate = sampleNpcRate();
    this.playerRate = autoPlayer ? sampleNpcRate() : null;
  }

  registerPlayerClick() {
    if (this.winner || this.playerRate !== null) return;
    this.playerProgress = Math.min(1, this.playerProgress + 1 / CLICKS_TO_WIN);
    if (this.playerProgress >= 1) this.winner = 'player';
  }

  tick(dt: number) {
    if (this.winner) return;
    if (this.playerRate !== null) {
      this.playerProgress = Math.min(1, this.playerProgress + (this.playerRate * dt) / CLICKS_TO_WIN);
      if (this.playerProgress >= 1) this.winner = 'player';
    }
    this.npcProgress = Math.min(1, this.npcProgress + (this.npcRate * dt) / CLICKS_TO_WIN);
    if (this.npcProgress >= 1) this.winner = 'npc';
  }
}
