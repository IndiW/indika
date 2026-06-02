import { getSeatPositions, SeatPosition } from './CircleLayout';
import { ItWalker } from './ItWalker';
import { RaceSimulator } from './RaceSimulator';

export type GamePhase = 'waiting' | 'racing' | 'round_over' | 'game_over';

export interface GameSnapshot {
  phase: GamePhase;
  seats: SeatPosition[];
  playerSeatIndex: number;
  gooseSeatIndex: number | null;
  openSeatIndex: number | null;
  itAngle: number;
  itNearestIndex: number;
  score: number;
  strikes: number;
  lastRoundWinner: 'player' | 'npc' | null;
  playerRaceAngle: number;
  npcRaceAngle: number;
  playerRaceProgress: number;
  npcRaceProgress: number;
  playerIsGoose: boolean;
  playerIsIt: boolean;
  canWaddle: boolean;
  canTag: boolean;
  npcSeatWins: number[];
  seatOccupants: (string | null)[];
  itName: string;
  gooseName: string | null;
}

const NUM_DUCKS = 5;
const PLAYER_SEAT = 0;
const SEAT_RADIUS_RATIO = 0.55; // seats on inner circle; IT walks the full outer radius
const ROUND_OVER_DURATION = 1.8;
const FULL_CIRCLE = Math.PI * 2;
const TAG_PROXIMITY = 0.45; // radians — GOOSE button enabled within this arc of a duck

export { SEAT_RADIUS_RATIO };

export class GameEngine {
  private seats: SeatPosition[];
  private walker: ItWalker;
  private race: RaceSimulator | null = null;

  phase: GamePhase = 'waiting';
  score = 0;
  strikes = 0;
  private npcSeatWins: number[] = new Array(NUM_DUCKS).fill(0);

  private gooseSeatIndex: number | null = null;
  private openSeatIndex: number | null = null;
  private lastRoundWinner: 'player' | 'npc' | null = null;
  private seatOccupants: (string | null)[] = ['YOU', 'MOE', 'ACE', 'DOT', 'RAE'];
  private itName = 'REX';
  private gooseName: string | null = null;
  private roundOverTimer = 0;
  private playerIsGoose = false;
  private playerIsIt = false;

  private raceOriginAngle = 0;
  private openSpotAngle = 0;
  private raceDelay = 0;
  private playerSeatIndex = PLAYER_SEAT;

  constructor(cx: number, cy: number, radius: number) {
    this.seats = getSeatPositions(NUM_DUCKS, cx, cy, radius * SEAT_RADIUS_RATIO);
    this.walker = new ItWalker(
      this.seats,
      this.seats[1].angle,
      (seatIndex) => this.handleTag(seatIndex)
    );
  }

  resize(cx: number, cy: number, radius: number) {
    this.seats = getSeatPositions(NUM_DUCKS, cx, cy, radius * SEAT_RADIUS_RATIO);
    this.walker.reset(this.seats);
  }

  // Step forward one pace (walking phase) or tap to advance in race.
  waddleClick() {
    if (this.phase === 'waiting' && this.playerIsIt) {
      this.walker.step();
    } else if (this.phase === 'racing' && (this.playerIsGoose || this.playerIsIt) && this.raceDelay <= 0) {
      this.race?.registerPlayerClick();
    }
  }

  // Tag the nearest seated duck as the goose.
  gooseClick() {
    if (this.phase === 'waiting' && this.playerIsIt) {
      this.walker.triggerTag();
    }
  }

  tick(dt: number) {
    if (this.phase === 'waiting') {
      this.walker.tick(dt);
    } else if (this.phase === 'racing') {
      if (this.raceDelay > 0) {
        this.raceDelay = Math.max(0, this.raceDelay - dt);
        if (this.raceDelay === 0) {
          const autoPlayer = !this.playerIsGoose && !this.playerIsIt;
          this.race = new RaceSimulator(FULL_CIRCLE, FULL_CIRCLE, autoPlayer);
        }
      } else if (this.race) {
        this.race.tick(dt);
        if (this.race.winner) {
          this.lastRoundWinner = this.race.winner;
          if (this.playerIsGoose || this.playerIsIt) {
            if (this.race.winner === 'player') this.score++;
            else this.strikes++;
          }
          // Award a win to the NPC duck that won as the goose (CCW runner).
          // CCW wins when: playerIsIt + winner==='npc', or NPC-vs-NPC + winner==='player'.
          const gooseWon = this.playerIsIt
            ? this.race.winner === 'npc'
            : !this.playerIsGoose && this.race.winner === 'player';
          if (gooseWon && this.gooseSeatIndex !== null) {
            this.npcSeatWins[this.gooseSeatIndex]++;
          }
          this.phase = 'round_over';
          this.roundOverTimer = ROUND_OVER_DURATION;
        }
      }
    } else if (this.phase === 'round_over') {
      this.roundOverTimer -= dt;
      if (this.roundOverTimer <= 0) {
        this.startNextRound();
      }
    }
  }

  private handleTag(seatIndex: number): boolean {
    if (this.phase !== 'waiting') return false;

    this.gooseSeatIndex = seatIndex;
    this.openSeatIndex = seatIndex;
    // Player is the goose when the NPC IT walker tags the player's current seat
    this.playerIsGoose = !this.playerIsIt && seatIndex === this.playerSeatIndex;

    this.gooseName = this.seatOccupants[seatIndex] ?? null;
    this.seatOccupants[seatIndex] = null;

    this.openSpotAngle = this.seats[seatIndex].angle;
    this.raceOriginAngle = this.openSpotAngle;

    this.race = null;
    this.raceDelay = 0.5;
    this.phase = 'racing';
    return true;
  }

  private startNextRound() {
    const stayIt = (this.playerIsGoose || this.playerIsIt) && this.lastRoundWinner === 'npc';

    // When player wins as IT they sit in the tagged duck's vacated spot
    if (this.playerIsIt && this.lastRoundWinner === 'player' && this.openSeatIndex !== null) {
      this.playerSeatIndex = this.openSeatIndex;
    }

    // Move duck identities: goose returns to seat if goose won; otherwise IT sits, goose becomes IT.
    // "goose won" = CCW runner won: NPC goose when playerIsIt, else the goose auto-runner.
    const gooseWon = this.playerIsIt
      ? this.lastRoundWinner === 'npc'
      : this.lastRoundWinner === 'player';
    if (this.openSeatIndex !== null && this.gooseName !== null) {
      if (gooseWon) {
        this.seatOccupants[this.openSeatIndex] = this.gooseName;
      } else {
        this.seatOccupants[this.openSeatIndex] = this.itName;
        this.itName = this.gooseName;
      }
    }
    this.gooseName = null;

    let itAngle: number;
    if (this.playerIsGoose && stayIt) {
      itAngle = this.raceOriginAngle - (this.race?.playerProgress ?? 0) * FULL_CIRCLE;
    } else {
      const itProgress = this.playerIsIt
        ? (this.race?.playerProgress ?? 0)
        : (this.race?.npcProgress ?? 0);
      itAngle = this.raceOriginAngle + itProgress * FULL_CIRCLE;
    }

    this.gooseSeatIndex = null;
    this.openSeatIndex = null;
    this.lastRoundWinner = null;
    this.playerIsGoose = false;
    this.playerIsIt = stayIt;
    this.race = null;
    this.raceDelay = 0;
    this.walker.manualTagMode = stayIt;
    this.walker.reset(this.seats, itAngle);
    this.phase = 'waiting';
  }

  restart() {
    this.score = 0;
    this.strikes = 0;
    this.phase = 'waiting';
    this.gooseSeatIndex = null;
    this.openSeatIndex = null;
    this.lastRoundWinner = null;
    this.playerIsGoose = false;
    this.playerIsIt = false;
    this.playerSeatIndex = PLAYER_SEAT;
    this.race = null;
    this.raceDelay = 0;
    this.npcSeatWins = new Array(NUM_DUCKS).fill(0);
    this.seatOccupants = ['YOU', 'MOE', 'ACE', 'DOT', 'RAE'];
    this.itName = 'REX';
    this.gooseName = null;
    this.walker.manualTagMode = false;
    this.walker.reset(this.seats);
  }

  getSnapshot(): GameSnapshot {
    const rp = this.race?.playerProgress ?? 0;
    const rn = this.race?.npcProgress ?? 0;

    const playerRaceAngle = this.playerIsIt
      ? this.raceOriginAngle + rp * FULL_CIRCLE
      : this.raceOriginAngle - rp * FULL_CIRCLE;
    const npcRaceAngle = this.playerIsIt
      ? this.raceOriginAngle - rn * FULL_CIRCLE
      : this.raceOriginAngle + rn * FULL_CIRCLE;

    const canWaddle =
      (this.phase === 'waiting' && this.playerIsIt) ||
      (this.phase === 'racing' && (this.playerIsGoose || this.playerIsIt) && this.raceDelay <= 0);

    const canTag =
      this.phase === 'waiting' &&
      this.playerIsIt &&
      this.walker.nearestDist < TAG_PROXIMITY;

    return {
      phase: this.phase,
      seats: this.seats,
      playerSeatIndex: this.playerSeatIndex,
      gooseSeatIndex: this.gooseSeatIndex,
      openSeatIndex: this.openSeatIndex,
      itAngle: this.walker.angle,
      itNearestIndex: this.walker.nearestIndex,
      score: this.score,
      strikes: this.strikes,
      lastRoundWinner: this.lastRoundWinner,
      playerRaceAngle,
      npcRaceAngle,
      playerRaceProgress: rp,
      npcRaceProgress: rn,
      playerIsGoose: this.playerIsGoose,
      playerIsIt: this.playerIsIt,
      canWaddle,
      canTag,
      npcSeatWins: [...this.npcSeatWins],
      seatOccupants: [...this.seatOccupants],
      itName: this.itName,
      gooseName: this.gooseName,
    };
  }
}
