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
