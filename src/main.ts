import Phaser from "phaser";
import "./style.css";
import { ArenaScene } from "./game/ArenaScene";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-root",
  width: 480,
  height: 800,
  backgroundColor: "#0a1120",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "matter",
    matter: {
      gravity: { x: 0, y: 0.6 },
      debug: false,
    },
  },
  scene: [ArenaScene],
});
