export interface SpriteFrame {
  id: number;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SpriteAnimation {
  id: number;
  name: string;
  sequence: number[]; // frame IDs (may repeat)
  fps: number;
  loop: boolean;
}
