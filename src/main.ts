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

function startRun(): void {
  overlay.classList.remove("show");
  game.scene.start("runner", { onGameOver: handleGameOver });
}

function handleGameOver(distance: number): void {
  finalDistanceEl.textContent = String(distance);
  overlay.classList.add("show");
}

restartBtn.addEventListener("click", startRun);

game.events.once(Phaser.Core.Events.READY, () => {
  game.scene.start("runner", { onGameOver: handleGameOver });
});
