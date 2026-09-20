import Phaser from "phaser";
import "./style.css";
import { hydrateIcons } from "./icons";
import { MainScene } from "./game/scenes/MainScene";
import {
  type PetState,
  createNewPet,
  tick,
  feed,
  play,
  toggleSleep,
  heal,
  clean,
  gift,
  getMood,
  getLevel,
  getStageProgress,
  getAttributes,
  STAGE_LABEL,
  GIFT_COST_VALUE,
} from "./game/Pet";
import { loadPet, savePet, clearPet } from "./game/Storage";

const NAV_LABELS: Record<string, string> = {
  cuidar: "Cuidar",
  treinar: "Treinar",
  minigames: "Minigames",
  arena: "Arena",
  inventario: "Inventário",
  bestiario: "Bestiário",
  config: "Configurações",
};

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

class GameController {
  private pet: PetState;
  private scene: MainScene;

  private els = {
    name: byId<HTMLElement>("pet-name"),
    level: byId<HTMLElement>("pet-level"),
    xpFill: byId<HTMLElement>("xp-fill"),
    xpText: byId<HTMLElement>("xp-text"),
    hpFill: byId<HTMLElement>("hp-fill"),
    hpText: byId<HTMLElement>("hp-text"),
    energyFill: byId<HTMLElement>("energy-fill"),
    energyText: byId<HTMLElement>("energy-text"),
    coinCount: byId<HTMLElement>("coin-count"),
    hungerFill: byId<HTMLElement>("hunger-fill"),
    happinessFill: byId<HTMLElement>("happiness-fill"),
    energy2Fill: byId<HTMLElement>("energy2-fill"),
    attrHp: byId<HTMLElement>("attr-hp"),
    attrAttack: byId<HTMLElement>("attr-attack"),
    attrDefense: byId<HTMLElement>("attr-defense"),
    attrSpeed: byId<HTMLElement>("attr-speed"),
    attrIntel: byId<HTMLElement>("attr-intel"),
    statusToast: byId<HTMLElement>("status-toast"),
    sleepLabel: byId<HTMLElement>("sleep-label"),
    avatar: byId<HTMLElement>("avatar-thumb"),
    deathOverlay: byId<HTMLElement>("death-overlay"),
    toastBanner: byId<HTMLElement>("toast-banner"),
  };

  private toastTimeout: number | undefined;

  constructor(scene: MainScene) {
    this.scene = scene;
    this.pet = loadPet() ?? createNewPet("Tami");
    this.pet = tick(this.pet, Date.now());

    this.bindActions();
    this.bindNav();
    byId<HTMLButtonElement>("restart-btn").addEventListener("click", () => this.restart());

    this.refresh();
    savePet(this.pet);

    setInterval(() => {
      this.pet = tick(this.pet, Date.now());
      this.refresh();
      savePet(this.pet);
    }, 1000);

    window.addEventListener("beforeunload", () => savePet(this.pet));
  }

  private bindActions(): void {
    document.querySelectorAll<HTMLButtonElement>(".action-btn[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        switch (action) {
          case "feed":
            this.pet = feed(this.pet);
            break;
          case "sleep":
            this.pet = toggleSleep(this.pet);
            break;
          case "clean":
            this.pet = clean(this.pet);
            break;
          case "play":
            this.pet = play(this.pet);
            break;
          case "gift": {
            if (this.pet.coins < GIFT_COST_VALUE) {
              this.showToast(`Moedas insuficientes (precisa de ${GIFT_COST_VALUE}).`);
              return;
            }
            this.pet = gift(this.pet);
            break;
          }
          case "heal":
            this.pet = heal(this.pet);
            break;
          case "explore":
            this.showToast("Exploração chegará em breve!");
            return;
          default:
            return;
        }
        this.refresh();
        savePet(this.pet);
      });
    });
  }

  private bindNav(): void {
    document.querySelectorAll<HTMLButtonElement>(".nav-btn[data-nav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.nav;
        if (key === "casa") return;
        this.showToast(`${NAV_LABELS[key ?? ""] ?? "Essa seção"} chegará em breve!`);
      });
    });
  }

  private showToast(message: string): void {
    this.els.toastBanner.textContent = message;
    this.els.toastBanner.classList.add("show");
    window.clearTimeout(this.toastTimeout);
    this.toastTimeout = window.setTimeout(() => {
      this.els.toastBanner.classList.remove("show");
    }, 2200);
  }

  private restart(): void {
    clearPet();
    this.pet = createNewPet("Tami");
    savePet(this.pet);
    this.els.deathOverlay.classList.remove("show");
    this.refresh();
  }

  private refresh(): void {
    const pet = this.pet;
    const mood = getMood(pet);
    const now = Date.now();
    const { current, total } = getStageProgress(pet, now);
    const attrs = getAttributes(pet);

    this.els.name.textContent = pet.name;
    this.els.level.textContent = `Lv. ${getLevel(pet)}`;

    if (Number.isFinite(total) && total > 0) {
      const pct = Math.min(100, (current / total) * 100);
      this.els.xpFill.style.width = `${pct}%`;
      this.els.xpText.textContent = `${Math.floor(current / 1000)}s / ${Math.floor(total / 1000)}s`;
    } else {
      this.els.xpFill.style.width = "100%";
      this.els.xpText.textContent = "MÁX";
    }

    this.els.hpFill.style.width = `${pet.health}%`;
    this.els.hpText.textContent = `${Math.round(pet.health)} / 100`;
    this.els.energyFill.style.width = `${pet.energy}%`;
    this.els.energyText.textContent = `${Math.round(pet.energy)} / 100`;
    this.els.coinCount.textContent = String(pet.coins);

    this.els.hungerFill.style.width = `${pet.hunger}%`;
    this.els.happinessFill.style.width = `${pet.happiness}%`;
    this.els.energy2Fill.style.width = `${pet.energy}%`;

    this.els.attrHp.textContent = String(Math.round(pet.health));
    this.els.attrAttack.textContent = String(attrs.attack);
    this.els.attrDefense.textContent = String(attrs.defense);
    this.els.attrSpeed.textContent = String(attrs.speed);
    this.els.attrIntel.textContent = String(attrs.intelligence);

    this.els.sleepLabel.textContent = pet.isSleeping ? "Acordar" : "Dormir";
    this.els.avatar.classList.toggle("sick", pet.isSick && !pet.isDead);

    if (pet.isDead) {
      this.els.statusToast.textContent = "Seu bichinho não resistiu... 💔";
      this.els.deathOverlay.classList.add("show");
    } else if (pet.isSick) {
      this.els.statusToast.textContent = "Seu bichinho está doente! Use o remédio.";
    } else if (pet.hunger < 20) {
      this.els.statusToast.textContent = "Seu bichinho está com fome!";
    } else if (pet.happiness < 20) {
      this.els.statusToast.textContent = "Seu bichinho está entediado.";
    } else if (pet.energy < 20 && !pet.isSleeping) {
      this.els.statusToast.textContent = "Seu bichinho está cansado, deixe-o dormir.";
    } else if (pet.isSleeping) {
      this.els.statusToast.textContent = `${STAGE_LABEL[pet.stage]} · Dormindo`;
    } else {
      this.els.statusToast.textContent = "Seu bichinho está bem! Parece animado hoje.";
    }

    this.scene.setVisual({
      stage: pet.stage,
      mood,
      isSick: pet.isSick,
      isSleeping: pet.isSleeping,
    });
  }
}

hydrateIcons();

const scene = new MainScene();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-root",
  width: 300,
  height: 320,
  transparent: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [scene],
});

game.events.once(Phaser.Core.Events.READY, () => {
  new GameController(scene);
});
