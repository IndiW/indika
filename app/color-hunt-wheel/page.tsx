import { Suspense } from "react";
import ColorHuntWheel from "./ColorHuntWheel";

export default function ColorHuntWheelPage() {
  return (
    <Suspense fallback={null}>
      <ColorHuntWheel />
    </Suspense>
  );
}
