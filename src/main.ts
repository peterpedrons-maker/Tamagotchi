import Phaser from "phaser";
import "./style.css";
import { ArenaScene } from "./game/ArenaScene";

// Forces an immediate update check against any old service worker still
// controlling this origin from a previous version of the game (see sw.js
// for why). This project itself registers nothing persistent.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const reg of regs) reg.update();
  });
}

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
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [ArenaScene],
});
