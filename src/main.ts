import Phaser from "phaser";
import "./style.css";
import { RunnerScene } from "./game/RunnerScene";

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

const overlay = byId<HTMLElement>("game-over");
const finalDistanceEl = byId<HTMLElement>("final-distance");
const restartBtn = byId<HTMLButtonElement>("restart-btn");

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-root",
  width: 480,
  height: 854,
  backgroundColor: "#05060a",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [RunnerScene],
});

// The runner scene is emitted on the shared Game event bus (rather than
// passed as scene.start() data) so restart timing can never race a scene
// still booting — this listener is wired once, independent of which scene
// instance ends up running.
game.events.on("gameover", (distance: number) => {
  finalDistanceEl.textContent = String(distance);
  overlay.classList.add("show");
});

restartBtn.addEventListener("click", () => {
  overlay.classList.remove("show");
  game.scene.start("runner");
});
