import { SeatPosition } from './CircleLayout';

const IT_SPEED = 0.8; // radians per second
const STEP_SIZE = 0.22; // radians per player click

export class ItWalker {
  angle: number;
  private speed = IT_SPEED;
  private seats: SeatPosition[];
  private onTag: (seatIndex: number) => boolean;
  private minPassedBeforeTag = 0;
  private passedCount = 0;
  private tagged = false;
  private lastNearestIndex = -1;
  nearestIndex = -1;
  nearestDist = Infinity;
  manualTagMode = false;

  constructor(seats: SeatPosition[], startAngle: number, onTag: (seatIndex: number) => boolean) {
    this.seats = seats;
    this.angle = startAngle;
    this.onTag = onTag;
    this.scheduleNextTag();
  }

  private scheduleNextTag() {
    this.minPassedBeforeTag = 2 + Math.floor(Math.random() * (this.seats.length - 2));
    this.passedCount = 0;
    this.tagged = false;
  }

  // Tag the nearest duck (used by the GOOSE button).
  triggerTag() {
    if (this.tagged || this.nearestIndex < 0) return;
    if (this.onTag(this.nearestIndex)) this.tagged = true;
  }

  // Advance one step around the circle (used by the WADDLE button).
  step() {
    this.angle += STEP_SIZE;
  }

  tick(dt: number) {
    if (!this.manualTagMode) {
      this.angle += this.speed * dt;
    }

    // find nearest seat (shortest arc in either direction)
    let minDist = Infinity;
    let nearest = 0;
    for (let i = 0; i < this.seats.length; i++) {
      const cw = this.normalizeAngle(this.seats[i].angle - this.angle);
      const da = Math.min(cw, 2 * Math.PI - cw);
      if (da < minDist) {
        minDist = da;
        nearest = i;
      }
    }
    this.nearestIndex = nearest;
    this.nearestDist = minDist;

    // count new duck passes
    if (nearest !== this.lastNearestIndex) {
      if (this.lastNearestIndex !== -1) this.passedCount++;
      this.lastNearestIndex = nearest;
    }

    // auto-tag when close enough and min passes met (disabled in manual mode)
    if (!this.manualTagMode && !this.tagged && this.passedCount >= this.minPassedBeforeTag && minDist < 0.25) {
      if (this.onTag(nearest)) this.tagged = true;
    }
  }

  reset(seats: SeatPosition[], startAngle?: number) {
    this.seats = seats;
    if (startAngle !== undefined) this.angle = startAngle;
    this.lastNearestIndex = -1;
    this.nearestDist = Infinity;
    this.scheduleNextTag();
  }

  private normalizeAngle(a: number): number {
    return ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  }
}
