import Phaser from "phaser";
import { MainScene } from "./game/scenes/MainScene";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  width: 400,
  height: 540,
  backgroundColor: "#0f172a",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainScene],
});
