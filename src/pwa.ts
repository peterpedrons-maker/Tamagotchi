import { hydrateIcons } from "./icons";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !("MSStream" in window);
}

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function setupInstallPrompt(): void {
  if (isStandalone()) return;

  const overlay = byId<HTMLElement>("install-prompt");
  const installBtn = byId<HTMLButtonElement>("install-btn");
  const dismissBtn = byId<HTMLButtonElement>("install-dismiss");
  const iosSteps = byId<HTMLElement>("install-ios-steps");
  if (!overlay || !installBtn || !dismissBtn) return;

  const show = () => overlay.classList.add("show");
  const hide = () => overlay.classList.remove("show");

  dismissBtn.addEventListener("click", hide);

  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    show();
  });

  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    hide();
  });

  window.addEventListener("appinstalled", hide);

  if (isIos()) {
    iosSteps?.classList.add("show");
    installBtn.hidden = true;
    window.setTimeout(show, 1200);
  }
}

export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

function canUseFullscreen(): boolean {
  return typeof document.documentElement.requestFullscreen === "function" && document.fullscreenEnabled;
}

async function requestGameFullscreen(): Promise<void> {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  } catch {
    // Ignore: the browser may deny it outside a direct user gesture.
  }
}

export function setupFullscreenToggle(): void {
  const btn = byId<HTMLButtonElement>("fullscreen-btn");
  if (!btn || !canUseFullscreen()) return;

  btn.hidden = false;

  const updateIcon = () => {
    btn.innerHTML = "";
    const span = document.createElement("span");
    span.dataset.icon = document.fullscreenElement ? "shrink" : "expand";
    span.dataset.iconSize = "18";
    btn.appendChild(span);
    hydrateIcons(btn);
  };

  btn.addEventListener("click", async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Ignore.
      }
    } else {
      await requestGameFullscreen();
    }
  });

  document.addEventListener("fullscreenchange", updateIcon);
  updateIcon();
}

/**
 * Android hides the status/navigation bars only via the Fullscreen API,
 * triggered from a direct tap — manifest "display" alone isn't reliable
 * enough (and doesn't affect an app that was already installed before it
 * changed). Show an explicit "tap to start" screen so that gesture is
 * always available, instead of hoping the player finds the small toggle.
 */
export function setupStartScreen(): void {
  const overlay = byId<HTMLElement>("start-screen");
  const startBtn = byId<HTMLButtonElement>("start-btn");
  if (!overlay || !startBtn || !canUseFullscreen()) return;

  overlay.classList.add("show");

  startBtn.addEventListener("click", async () => {
    await requestGameFullscreen();
    overlay.classList.remove("show");
  });
}
