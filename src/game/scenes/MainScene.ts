import Phaser from "phaser";
import {
  type PetState,
  createNewPet,
  tick,
  feed,
  play,
  toggleSleep,
  heal,
  getMood,
} from "../Pet";
import { loadPet, savePet, clearPet } from "../Storage";
import { ensureCreatureTexture } from "../creatureArt";

const STAGE_LABEL: Record<PetState["stage"], string> = {
  egg: "Ovo",
  baby: "Bebê",
  child: "Criança",
  teen: "Adolescente",
  adult: "Adulto",
};

interface Bar {
  bg: Phaser.GameObjects.Rectangle;
  fill: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

export class MainScene extends Phaser.Scene {
  private pet!: PetState;
  private sprite!: Phaser.GameObjects.Image;
  private stageText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private hungerBar!: Bar;
  private happinessBar!: Bar;
  private healthBar!: Bar;
  private energyBar!: Bar;
  private deathOverlay?: Phaser.GameObjects.Container;

  constructor() {
    super("MainScene");
  }

  create(): void {
    this.pet = loadPet() ?? createNewPet("Tami");
    this.pet = tick(this.pet, Date.now());

    this.cameras.main.setBackgroundColor("#0f172a");

    this.add
      .rectangle(200, 40, 400, 80, 0x1e293b)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0x334155);

    this.add
      .text(200, 24, this.pet.name, { fontSize: "22px", color: "#f8fafc", fontStyle: "bold" })
      .setOrigin(0.5);

    this.stageText = this.add
      .text(200, 52, "", { fontSize: "14px", color: "#94a3b8" })
      .setOrigin(0.5);

    const initialKey = ensureCreatureTexture(
      this,
      this.pet.stage,
      getMood(this.pet),
      this.pet.isSick,
      this.pet.isSleeping
    );
    this.sprite = this.add.image(200, 195, initialKey).setOrigin(0.5).setScale(0.85);

    this.hungerBar = this.createBar(310, "Fome", 0xef4444);
    this.happinessBar = this.createBar(340, "Felicidade", 0xf59e0b);
    this.healthBar = this.createBar(370, "Saúde", 0x22c55e);
    this.energyBar = this.createBar(400, "Sono", 0x60a5fa);

    this.statusText = this.add
      .text(200, 430, "", { fontSize: "13px", color: "#fbbf24" })
      .setOrigin(0.5);

    this.createButton(70, 470, "Alimentar", () => {
      this.pet = feed(this.pet);
      this.refresh();
    });
    this.createButton(200, 470, "Brincar", () => {
      this.pet = play(this.pet);
      this.refresh();
    });
    this.createButton(330, 470, "Remédio", () => {
      this.pet = heal(this.pet);
      this.refresh();
    });
    this.createButton(135, 510, () => (this.pet.isSleeping ? "Acordar" : "Dormir"), () => {
      this.pet = toggleSleep(this.pet);
      this.refresh();
    });
    this.createButton(265, 510, "Reiniciar", () => this.restart());

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.pet = tick(this.pet, Date.now());
        this.refresh();
        savePet(this.pet);
      },
    });

    window.addEventListener("beforeunload", () => savePet(this.pet));

    this.refresh();
  }

  private createBar(y: number, label: string, color: number): Bar {
    const barWidth = 260;
    const x = 200 - barWidth / 2;
    const labelText = this.add.text(x - 10, y - 9, label, {
      fontSize: "12px",
      color: "#e2e8f0",
    }).setOrigin(1, 0);
    const bg = this.add
      .rectangle(x, y, barWidth, 16, 0x334155)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x475569);
    const fill = this.add.rectangle(x + 1, y + 1, barWidth - 2, 14, color).setOrigin(0, 0);
    return { bg, fill, label: labelText };
  }

  private setBar(bar: Bar, value: number): void {
    const maxWidth = (bar.bg.width as number) - 2;
    bar.fill.width = Math.max(0, (value / 100) * maxWidth);
  }

  private createButton(
    x: number,
    y: number,
    labelOrFn: string | (() => string),
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const getLabel = typeof labelOrFn === "function" ? labelOrFn : () => labelOrFn;
    const bg = this.add
      .rectangle(0, 0, 110, 36, 0x2563eb)
      .setStrokeStyle(1, 0x1d4ed8)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(0, 0, getLabel(), { fontSize: "13px", color: "#f8fafc" }).setOrigin(0.5);
    const container = this.add.container(x, y, [bg, text]);

    bg.on("pointerover", () => bg.setFillStyle(0x3b82f6));
    bg.on("pointerout", () => bg.setFillStyle(0x2563eb));
    bg.on("pointerdown", () => {
      onClick();
      text.setText(getLabel());
    });
    container.setData("refreshLabel", () => text.setText(getLabel()));
    return container;
  }

  private refresh(): void {
    const mood = getMood(this.pet);
    const key = ensureCreatureTexture(this, this.pet.stage, mood, this.pet.isSick, this.pet.isSleeping);
    this.sprite.setTexture(key);

    this.stageText.setText(
      `${STAGE_LABEL[this.pet.stage]}${this.pet.isSleeping ? " · Dormindo" : ""}${this.pet.isSick ? " · Doente" : ""}`
    );

    this.setBar(this.hungerBar, this.pet.hunger);
    this.setBar(this.happinessBar, this.pet.happiness);
    this.setBar(this.healthBar, this.pet.health);
    this.setBar(this.energyBar, this.pet.energy);

    if (this.pet.isDead) {
      this.statusText.setText("Seu bichinho não resistiu... 💔");
      this.showDeathOverlay();
    } else if (this.pet.isSick) {
      this.statusText.setText("Seu bichinho está doente! Use o remédio.");
    } else if (this.pet.hunger < 20) {
      this.statusText.setText("Seu bichinho está com fome!");
    } else if (this.pet.happiness < 20) {
      this.statusText.setText("Seu bichinho está entediado.");
    } else if (this.pet.energy < 20 && !this.pet.isSleeping) {
      this.statusText.setText("Seu bichinho está cansado, deixe-o dormir.");
    } else {
      this.statusText.setText("");
    }

    for (const child of this.children.list) {
      if (child instanceof Phaser.GameObjects.Container) {
        const fn = child.getData("refreshLabel") as (() => void) | undefined;
        fn?.();
      }
    }
  }

  private showDeathOverlay(): void {
    if (this.deathOverlay) return;
    const overlay = this.add.rectangle(200, 270, 400, 540, 0x000000, 0.6).setOrigin(0.5);
    const text = this.add
      .text(200, 270, "Fim de jogo", { fontSize: "20px", color: "#f8fafc" })
      .setOrigin(0.5);
    this.deathOverlay = this.add.container(0, 0, [overlay, text]);
  }

  private restart(): void {
    clearPet();
    this.deathOverlay?.destroy();
    this.deathOverlay = undefined;
    this.pet = createNewPet("Tami");
    savePet(this.pet);
    this.refresh();
  }
}
