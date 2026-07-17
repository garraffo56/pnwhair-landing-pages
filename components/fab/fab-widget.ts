// ─────────────────────────────────────────────────────────────────────────────
// RootLogic FAB — framework-free widget core (mountFab).
//
// Ported from the WordPress plugin's launcher.js (v2.2.3, four live Safari bugs
// already fixed — kept intact) with these LP-fleet changes:
//   • Mounts UNCONDITIONALLY — no GHL-detection gate. LP pages carry GHL forms,
//     not necessarily the GHL chat widget; the FAB's job is Call + Chat.
//   • Config is FETCHED from control (/api/fab-config/<client>) at runtime, so
//     control edits reflect on the fleet within seconds, no redeploy.
//   • Call resolution: a "phone" item with source "page" dials the tracked number
//     that DNI put on the page (sessionStorage lease → light-DOM tel: → fallback),
//     re-resolved every time the card opens so a late lease is honored. No new
//     conversion tracking is added (medical §6 fm-7 — attribution rides the
//     existing pool-call → lease-match pipeline).
//   • CSS is inlined into the shadow root (no per-site asset URL). Avatar 64px.
//   • Wave avatar uses an inline emoji (no bundled PNGs).
//
// The GHL idle-hide / open-state coexistence logic is retained: harmless when GHL
// chat is absent, correct when present.
// ─────────────────────────────────────────────────────────────────────────────
import {
  type FabFrontendPayload,
  type FabFrontendItem,
  FAB_ICON_PATHS,
} from "./fab-config";

export interface MountFabOptions {
  client: string;
  controlOrigin?: string; // default https://control.effvit.com
}

const DEFAULT_ORIGIN = "https://control.effvit.com";
const OPEN_RETRY_TIMEOUT_MS = 5000;
const OPEN_RETRY_POLL_MS = 200;

function svgIcon(pathD: string): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${pathD}</svg>`;
}

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  if (!m) return `rgba(19, 32, 57, ${alpha})`;
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`;
}

// ── GHL chat coexistence (retained from launcher.js) ─────────────────────────
type GhlWindow = Window & {
  leadConnector?: { chatWidget?: { openWidget?: () => void } };
};
function chatWidgetReady(): boolean {
  const w = window as GhlWindow;
  return !!(w.leadConnector && w.leadConnector.chatWidget && typeof w.leadConnector.chatWidget.openWidget === "function");
}
function openGhlChat(): void {
  if (chatWidgetReady()) {
    (window as GhlWindow).leadConnector!.chatWidget!.openWidget!();
    return;
  }
  let waited = 0;
  const retry = setInterval(() => {
    waited += OPEN_RETRY_POLL_MS;
    if (chatWidgetReady()) {
      clearInterval(retry);
      (window as GhlWindow).leadConnector!.chatWidget!.openWidget!();
    } else if (waited >= OPEN_RETRY_TIMEOUT_MS) {
      clearInterval(retry);
    }
  }, OPEN_RETRY_POLL_MS);
}
function enforceGhlIdleHidden(): void {
  const watched = new WeakSet<Element>();
  const applyState = (el: Element) => {
    const active = el.getAttribute("data-active") === "true";
    (el as HTMLElement).style.setProperty("display", active ? "" : "none", active ? "" : "important");
  };
  const watch = (el: Element) => {
    if (watched.has(el)) return;
    watched.add(el);
    applyState(el);
    new MutationObserver(() => applyState(el)).observe(el, {
      attributes: true,
      attributeFilter: ["data-active"],
    });
  };
  document.querySelectorAll("chat-widget").forEach(watch);
  new MutationObserver((muts) => {
    muts.forEach((m) =>
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        const el = node as Element;
        if (el.matches?.("chat-widget")) watch(el);
        el.querySelectorAll?.("chat-widget").forEach(watch);
      })
    );
  }).observe(document.documentElement, { childList: true, subtree: true });
}
function watchGhlOpenState(root: HTMLElement): void {
  const el = document.querySelector("chat-widget");
  if (!el) return;
  const sync = () => {
    const active = el.getAttribute("data-active") === "true";
    root.classList.toggle("effvit-cl-ghl-open", active);
    root.style.display = active ? "none" : "";
  };
  sync();
  new MutationObserver(sync).observe(el, { attributes: true, attributeFilter: ["data-active"] });
}

// ── Call-number resolution (DNI-aware, attribution-preserving) ───────────────
function resolveTrackedNumber(fallback: string): string {
  // 1) unexpired DNI lease written by DniSwap
  try {
    const raw = sessionStorage.getItem("dni_lease");
    if (raw) {
      const lease = JSON.parse(raw) as { number?: string; exp?: number };
      if (lease?.number && (!lease.exp || lease.exp > Date.now())) return lease.number;
    }
  } catch {
    /* ignore */
  }
  // 2) whatever number is live on the page (DNI-swapped on paid sessions, static otherwise)
  const tel = document.querySelector('a[href^="tel:"]');
  if (tel) {
    const digits = (tel.getAttribute("href") || "").replace(/^tel:/i, "").replace(/[^0-9+]/g, "");
    if (digits) return digits;
  }
  // 3) configured fallback
  return (fallback || "").replace(/[^0-9+]/g, "");
}
function phoneHref(item: FabFrontendItem): string {
  let digits: string;
  if (item.phoneSource === "config") {
    digits = (item.actionValue || "").replace(/[^0-9+]/g, "");
  } else {
    // "page" (default) — resolve the tracked number; fall back to actionValue.
    digits = resolveTrackedNumber(item.actionValue);
  }
  return "tel:" + digits;
}

// ── Styles (ported launcher.css, inlined, avatar 64px, emoji wave) ───────────
function styleText(): string {
  return `
:host{all:initial;position:fixed;bottom:calc(var(--nsw-offset-y,18px) + env(safe-area-inset-bottom,0px));right:calc(var(--nsw-offset-x,18px) + env(safe-area-inset-right,0px));z-index:999990;display:block;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;--nsw-accent:#132039;--nsw-on-accent:#fff;--nsw-surface:#fff;--nsw-text:#1b1b1f;--nsw-radius:20px}
:host(.effvit-cl-pos-left){right:auto;left:calc(var(--nsw-offset-x,18px) + env(safe-area-inset-left,0px))}
*,*::before,*::after{box-sizing:border-box}
:host(.effvit-cl-ghl-open){display:none}
@media(max-width:768px){:host(.effvit-cl-hide-mobile){display:none}}
.effvit-cl-avatar{position:relative;width:64px;height:64px;min-width:44px;min-height:44px;border-radius:50%;background:var(--nsw-accent);color:var(--nsw-on-accent);border:none;outline:none;cursor:pointer;padding:0;box-shadow:0 6px 18px rgba(19,32,57,.28);font-family:inherit;display:flex;align-items:center;justify-content:center}
.effvit-cl-avatar:focus-visible{outline:2px solid var(--nsw-on-accent);outline-offset:3px}
.effvit-cl-avatar-inner{position:relative;z-index:1;width:100%;height:100%;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center}
.effvit-cl-avatar-img{width:100%;height:100%;object-fit:cover}
.effvit-cl-avatar-initials{font-size:20px;font-weight:700;letter-spacing:.02em;color:var(--nsw-on-accent);text-transform:uppercase}
.effvit-cl-wave{font-size:30px;line-height:1;transform-origin:70% 70%;animation:effvit-cl-wave 3.4s ease-in-out infinite}
@keyframes effvit-cl-wave{0%,14%,86%,100%{transform:rotate(0)}22%{transform:rotate(20deg)}30%{transform:rotate(-12deg)}38%{transform:rotate(18deg)}46%{transform:rotate(-8deg)}54%{transform:rotate(12deg)}62%{transform:rotate(0)}}
.effvit-cl-pulse-ring{position:absolute;inset:0;border-radius:50%;background:var(--nsw-accent);pointer-events:none;animation:effvit-cl-pulse 4s cubic-bezier(.4,0,.6,1) infinite}
@keyframes effvit-cl-pulse{0%{transform:scale(1);opacity:.55}30%{transform:scale(1.55);opacity:0}100%{transform:scale(1.55);opacity:0}}
.effvit-cl-bounce-once{animation:effvit-cl-bounce .9s cubic-bezier(.28,.84,.42,1) .4s both}
@keyframes effvit-cl-bounce{0%,100%{transform:translateY(0)}30%{transform:translateY(-14px)}50%{transform:translateY(0)}68%{transform:translateY(-6px)}84%{transform:translateY(0)}}
.effvit-cl-unread-dot{position:absolute;z-index:2;top:-2px;right:-2px;width:14px;height:14px;border-radius:50%;background:#e6483c;border:2px solid var(--nsw-surface,#fff)}
.effvit-cl-hover-label{position:absolute;bottom:calc(64px + 14px);right:0;background:var(--nsw-surface);color:var(--nsw-text);font-size:13px;font-weight:600;white-space:nowrap;padding:8px 14px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.16),0 2px 8px rgba(0,0,0,.06);cursor:pointer}
:host(.effvit-cl-pos-left) .effvit-cl-hover-label{right:auto;left:0}
:host(.is-open) .effvit-cl-hover-label{display:none}
.effvit-cl-card{position:absolute;bottom:calc(64px + 14px);right:0;width:max-content;max-width:min(90vw,360px);background:var(--nsw-surface);color:var(--nsw-text);border-radius:var(--nsw-radius);box-shadow:0 20px 60px rgba(0,0,0,.18),0 4px 16px rgba(0,0,0,.08);padding:16px;transform-origin:bottom right;transform:scale(.85) translateY(8px);opacity:0;pointer-events:none;outline:none;transition:transform .22s cubic-bezier(.25,.1,.25,1),opacity .18s ease}
:host(.is-open) .effvit-cl-card{transform:scale(1) translateY(0);opacity:1;pointer-events:auto}
:host(.effvit-cl-pos-left) .effvit-cl-card{right:auto;left:0;transform-origin:bottom left}
.effvit-cl-greeting{margin:0 0 12px;font-size:14px;line-height:1.4;font-weight:500;color:var(--nsw-text)}
.effvit-cl-chips{display:flex;flex-wrap:wrap;gap:8px}
.effvit-cl-chip{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:8px 14px 8px 10px;border:none;border-radius:999px;cursor:pointer;text-decoration:none;font-family:inherit;font-size:13.5px;font-weight:600;color:var(--nsw-text)}
.effvit-cl-chip:focus-visible{outline:2px solid var(--nsw-accent);outline-offset:2px}
.effvit-cl-chip-icon{display:flex;align-items:center;justify-content:center;flex:none}
.effvit-cl-chip-icon svg{width:18px;height:18px}
.effvit-cl-chip-label{white-space:nowrap}
@media(prefers-reduced-motion:reduce){.effvit-cl-wave,.effvit-cl-pulse-ring,.effvit-cl-bounce-once{animation:none}}
@media(max-width:480px){.effvit-cl-card{max-width:90vw}}
`;
}

function buildChip(item: FabFrontendItem): HTMLElement {
  const isLink = item.actionType === "url" || item.actionType === "phone";
  const el = document.createElement(isLink ? "a" : "button") as HTMLElement;
  el.className = "effvit-cl-chip";
  el.setAttribute("role", "menuitem");

  if (item.actionType === "url") {
    (el as HTMLAnchorElement).href = item.actionValue || "#";
    if (item.openNewTab) {
      (el as HTMLAnchorElement).target = "_blank";
      el.setAttribute("rel", "noopener");
    }
  } else if (item.actionType === "phone") {
    (el as HTMLAnchorElement).href = phoneHref(item);
  } else {
    (el as HTMLButtonElement).type = "button";
  }

  const tint = item.iconColor || "#1D9E75";
  el.style.background = hexToRgba(tint, 0.12);

  const iconSpan = document.createElement("span");
  iconSpan.className = "effvit-cl-chip-icon";
  iconSpan.style.color = tint;
  iconSpan.innerHTML = svgIcon(FAB_ICON_PATHS[item.icon] || FAB_ICON_PATHS["message-circle"]);

  const labelSpan = document.createElement("span");
  labelSpan.className = "effvit-cl-chip-label";
  labelSpan.textContent = item.label;

  el.appendChild(iconSpan);
  el.appendChild(labelSpan);
  return el;
}

function render(cfg: FabFrontendPayload): HTMLElement | null {
  if (!cfg.enabled || !cfg.items.length) return null;

  const root = document.createElement("div");
  root.id = "effvit-cl-widget";
  const shadow = root.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = styleText();
  shadow.appendChild(style);

  root.style.setProperty("--nsw-accent", cfg.accentColor || "#132039");
  root.style.setProperty("--nsw-on-accent", cfg.onAccentColor || "#ffffff");
  root.style.setProperty("--nsw-surface", cfg.cardSurfaceColor || "#ffffff");
  root.style.setProperty("--nsw-text", cfg.cardTextColor || "#1b1b1f");
  root.style.setProperty("--nsw-radius", (cfg.cardRadius ?? 20) + "px");
  root.style.setProperty("--nsw-offset-x", (cfg.offsetX ?? 18) + "px");
  root.style.setProperty("--nsw-offset-y", (cfg.offsetY ?? 18) + "px");
  if (cfg.position === "bottom-left") root.classList.add("effvit-cl-pos-left");
  if (!cfg.showMobile) root.classList.add("effvit-cl-hide-mobile");

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Card
  const card = document.createElement("div");
  card.className = "effvit-cl-card";
  card.tabIndex = -1;
  const greeting = document.createElement("p");
  greeting.className = "effvit-cl-greeting";
  greeting.textContent = cfg.greetingText || "Have a question? We're here to help.";
  const chipRow = document.createElement("div");
  chipRow.className = "effvit-cl-chips";
  chipRow.setAttribute("role", "menu");

  const chips = cfg.items.map((item) => {
    const chip = buildChip(item);
    chipRow.appendChild(chip);
    return chip;
  });

  // Re-resolve phone hrefs on open so a late DNI lease is honored.
  function refreshPhoneHrefs() {
    cfg.items.forEach((item, i) => {
      if (item.actionType === "phone") (chips[i] as HTMLAnchorElement).href = phoneHref(item);
    });
  }

  chips.forEach((chip, index) => {
    chip.addEventListener("click", (e) => {
      const item = cfg.items[index];
      if (item.actionType === "ghl_chat") {
        e.preventDefault();
        closeCard();
        openGhlChat();
      } else if (item.actionType === "scroll") {
        e.preventDefault();
        let target: Element | null = null;
        if (item.actionValue) {
          try {
            target = document.querySelector(item.actionValue);
          } catch {
            target = null;
          }
        }
        if (target) {
          closeCard();
          target.scrollIntoView({ behavior: "smooth" });
        }
      }
      // url / phone: native <a> navigation.
    });
  });
  card.appendChild(greeting);
  card.appendChild(chipRow);

  // Avatar
  const avatar = document.createElement("button");
  avatar.type = "button";
  avatar.className = "effvit-cl-avatar";
  avatar.setAttribute("aria-label", cfg.fabLabel || "Contact us");
  avatar.setAttribute("aria-haspopup", "true");
  avatar.setAttribute("aria-expanded", "false");
  const inner = document.createElement("span");
  inner.className = "effvit-cl-avatar-inner";
  if (cfg.avatarMode === "image" && cfg.avatarImageUrl) {
    const img = document.createElement("img");
    img.className = "effvit-cl-avatar-img";
    img.src = cfg.avatarImageUrl;
    img.alt = "";
    inner.appendChild(img);
  } else if (cfg.avatarMode === "initials") {
    const ini = document.createElement("span");
    ini.className = "effvit-cl-avatar-initials";
    ini.textContent = (cfg.avatarInitials || "Dr").slice(0, 2);
    inner.appendChild(ini);
  } else {
    const wave = document.createElement("span");
    wave.className = "effvit-cl-wave";
    wave.setAttribute("aria-hidden", "true");
    wave.textContent = "\u{1F44B}";
    inner.appendChild(wave);
  }
  avatar.appendChild(inner);

  if (cfg.attentionPulse && !reduced) {
    const ring = document.createElement("span");
    ring.className = "effvit-cl-pulse-ring";
    ring.setAttribute("aria-hidden", "true");
    avatar.appendChild(ring);
  }
  if (cfg.showUnreadDot) {
    const dot = document.createElement("span");
    dot.className = "effvit-cl-unread-dot";
    dot.setAttribute("aria-hidden", "true");
    avatar.appendChild(dot);
  }
  if (cfg.attentionBounce && !reduced) {
    avatar.classList.add("effvit-cl-bounce-once");
    avatar.addEventListener("animationend", function onEnd(e) {
      if ((e as AnimationEvent).animationName === "effvit-cl-bounce") {
        avatar.classList.remove("effvit-cl-bounce-once");
        avatar.removeEventListener("animationend", onEnd);
      }
    });
  }

  // Random bounce
  let randomTimer: number | null = null;
  function scheduleRandom() {
    randomTimer = window.setTimeout(() => {
      if (!root.classList.contains("is-open")) {
        avatar.classList.add("effvit-cl-bounce-once");
        avatar.addEventListener("animationend", function onEnd(e) {
          if ((e as AnimationEvent).animationName === "effvit-cl-bounce") {
            avatar.classList.remove("effvit-cl-bounce-once");
            avatar.removeEventListener("animationend", onEnd);
          }
        });
      }
      scheduleRandom();
    }, 20000 + Math.random() * 30000);
  }
  if (cfg.attentionRandomBounce && !reduced) scheduleRandom();

  // Hover label
  let hoverLabel: HTMLElement | null = null;
  if (cfg.showHoverLabel && cfg.hoverLabelText) {
    hoverLabel = document.createElement("div");
    hoverLabel.className = "effvit-cl-hover-label";
    hoverLabel.textContent = cfg.hoverLabelText;
    hoverLabel.setAttribute("aria-hidden", "true");
  }

  function openCard() {
    refreshPhoneHrefs();
    root.classList.add("is-open");
    avatar.setAttribute("aria-expanded", "true");
    if (randomTimer) {
      clearTimeout(randomTimer);
      randomTimer = null;
    }
    if (chips.length) chips[0].focus();
    else card.focus();
  }
  function closeCard() {
    root.classList.remove("is-open");
    avatar.setAttribute("aria-expanded", "false");
  }
  avatar.addEventListener("click", () =>
    root.classList.contains("is-open") ? closeCard() : openCard()
  );
  if (hoverLabel) hoverLabel.addEventListener("click", openCard);

  document.addEventListener("click", (e) => {
    if (!e.composedPath().includes(root)) closeCard();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("is-open")) {
      closeCard();
      avatar.focus();
    }
  });

  shadow.appendChild(card);
  if (hoverLabel) shadow.appendChild(hoverLabel);
  shadow.appendChild(avatar);
  watchGhlOpenState(root);
  return root;
}

// Mounts the FAB: fetches config for `client`, renders into document.body.
// Returns a cleanup function that removes the widget. Safe to call once per page.
export async function mountFab(opts: MountFabOptions): Promise<() => void> {
  const origin = opts.controlOrigin || DEFAULT_ORIGIN;
  enforceGhlIdleHidden();

  let cfg: FabFrontendPayload;
  try {
    const res = await fetch(`${origin}/api/fab-config/${encodeURIComponent(opts.client)}`, {
      credentials: "omit",
    });
    if (!res.ok) return () => {};
    cfg = (await res.json()) as FabFrontendPayload;
  } catch {
    return () => {};
  }

  const root = render(cfg);
  if (!root) return () => {};
  document.body.appendChild(root);
  return () => root.remove();
}
