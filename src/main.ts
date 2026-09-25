import Phaser from "phaser";
import "./style.css";
import { VillageScene } from "./game/VillageScene";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-root",
  width: 800,
  height: 600,
  backgroundColor: "#0a1120",
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scene: [VillageScene],
});
