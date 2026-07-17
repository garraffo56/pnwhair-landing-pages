// ─────────────────────────────────────────────────────────────────────────────
// RootLogic FAB — canonical config contract (shared across control, journey, LP)
//
// This is the SINGLE SOURCE OF TRUTH for the floating-action-button chat widget
// config. It is framework-agnostic (no React / Next / Supabase imports) so the
// exact same file is copied verbatim into:
//   - effvit-dashboard (control)  — src/lib/fabConfig.ts  (admin editor + API)
//   - journey-portal              — src/lib/fabConfig.ts  (client preview)
//   - each lp-fleet Next.js app   — lib/fabConfig.ts       (the <Fab/> component)
//
// It is ported 1:1 from the WordPress plugin `effvit-chat-launcher` (v2.2.3):
//   - global settings + item schema         = class-frontend-widget.php localize
//   - defaults / allowed-value helpers       = effvit-chat-launcher.php
//   - sanitizer                              = class-admin-settings.php::sanitize()
//   - icon path defs                         = launcher.js ICONS / admin icon_svg_defs
//
// Divergences from the WP plugin, all deliberate for the Next.js LP fleet:
//   1. The LP <Fab/> mounts UNCONDITIONALLY (the WP launcher only mounts when
//      GoHighLevel's <chat-widget> is detected). LP pages carry GHL *forms*, not
//      necessarily the GHL chat widget, and the FAB's job here is Call + Chat.
//   2. New `phone_source` field on phone items: "config" | "page" | "ghl" — lets a
//      Call action resolve the practice's tracked number (CTN) from the DNI number
//      already on the page, falling back to the stored number, so FAB calls stay
//      attributed. (WP always used the stored number.)
//   3. Fleet DEFAULT menu is Call + Chat only (Joe, 2026-07-17). Admin can add the
//      other action types / up to MAX_ITEMS later — the full capability is retained.
// ─────────────────────────────────────────────────────────────────────────────

export const FAB_SCHEMA_VERSION = "2.0";
export const FAB_MAX_ITEMS = 6;

export type FabIcon =
  | "calendar"
  | "message-circle"
  | "link"
  | "phone"
  | "user"
  | "mail"
  | "map-pin"
  | "clock"
  | "star"
  | "heart"
  | "help-circle"
  | "video"
  | "file-text";

export type FabActionType = "url" | "phone" | "ghl_chat" | "scroll";
export type FabAvatarMode = "wave" | "initials" | "image";
export type FabPosition = "bottom-right" | "bottom-left";

// How a `phone` action resolves the number it dials:
//   config → dial `action_value` verbatim.
//   page   → dial the tracked number currently rendered on the page (DNI), so the
//            call is attributed the same as an on-page click; falls back to
//            `action_value` when no page number is found.
//   ghl    → dial the number stored for the practice's GHL subaccount
//            (`ghl_call_number` below); falls back to `action_value`.
export type FabPhoneSource = "config" | "page" | "ghl";

export interface FabItem {
  label: string;
  icon: FabIcon;
  icon_color: string; // #rrggbb
  action_type: FabActionType;
  action_value: string; // url | phone number | scroll selector | "" for ghl_chat
  phone_source?: FabPhoneSource; // only meaningful when action_type === "phone"
  open_new_tab: boolean;
  enabled: boolean;
}

export interface FabConfig {
  schema_version: string;
  enabled: boolean;
  fab_label: string; // aria-label on the collapsed avatar button
  show_mobile: boolean;
  position: FabPosition;
  offset_x: number; // 0-100 px from side edge
  offset_y: number; // 0-100 px from bottom edge
  metrics_enabled: boolean;

  // Collapsed avatar circle
  avatar_mode: FabAvatarMode;
  avatar_initials: string; // <=2 chars
  avatar_image_url: string;
  attention_pulse: boolean;
  attention_bounce: boolean;
  attention_random_bounce: boolean;
  show_unread_dot: boolean;
  show_hover_label: boolean;
  hover_label_text: string; // <=30 chars

  // Expanded greeting card
  greeting_text: string; // <=160 chars
  accent_color: string; // --nsw-accent, #rrggbb
  on_accent_color: string; // --nsw-on-accent
  card_surface_color: string; // --nsw-surface (kept light for legibility)
  card_text_color: string; // --nsw-text
  card_radius: number; // 0-40 px

  // Practice-level phone fallback for phone_source === "ghl" (or "page" miss).
  // Not rendered directly; used only to resolve a Call action's number.
  ghl_call_number: string;

  items: FabItem[];
}

export const FAB_ALLOWED_ICONS: FabIcon[] = [
  "calendar",
  "message-circle",
  "link",
  "phone",
  "user",
  "mail",
  "map-pin",
  "clock",
  "star",
  "heart",
  "help-circle",
  "video",
  "file-text",
];

export const FAB_ALLOWED_ACTION_TYPES: FabActionType[] = [
  "url",
  "phone",
  "ghl_chat",
  "scroll",
];

export const FAB_ALLOWED_AVATAR_MODES: FabAvatarMode[] = [
  "wave",
  "initials",
  "image",
];

export const FAB_ALLOWED_PHONE_SOURCES: FabPhoneSource[] = [
  "config",
  "page",
  "ghl",
];

// Human labels for the admin icon <select>.
export const FAB_ICON_LABELS: Record<FabIcon, string> = {
  calendar: "Calendar",
  "message-circle": "Chat Bubble",
  link: "Chain Link",
  phone: "Phone",
  user: "Person",
  mail: "Envelope",
  "map-pin": "Location Pin",
  clock: "Clock",
  star: "Star",
  heart: "Heart",
  "help-circle": "Question Mark",
  video: "Video Camera",
  "file-text": "Document",
};

// Feather-style icon path data, keyed identically to launcher.js ICONS and the
// WP admin icon_svg_defs() so an admin preview swatch always matches what renders
// on the site. Inner content of a <svg viewBox="0 0 24 24"> only.
export const FAB_ICON_PATHS: Record<FabIcon, string> = {
  calendar:
    '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  "message-circle":
    '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  link:
    '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.5-1.5"/>',
  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
  user:
    '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  mail:
    '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  "map-pin":
    '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  clock:
    '<circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>',
  star:
    '<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>',
  heart:
    '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  "help-circle":
    '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  video:
    '<polygon points="23,7 16,12 23,17"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
  "file-text":
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
};

// ── Defaults ─────────────────────────────────────────────────────────────────

export function fabDefaultItem(overrides: Partial<FabItem> = {}): FabItem {
  return {
    label: "",
    icon: "message-circle",
    icon_color: "#1D9E75",
    action_type: "url",
    action_value: "",
    phone_source: "config",
    open_new_tab: false,
    enabled: true,
    ...overrides,
  };
}

// Fleet default menu = Call + Chat ONLY (Joe, 2026-07-17). Call is primary/first.
// Call resolves its number from the page's DNI number so it stays attributed.
export function fabDefaultItems(): FabItem[] {
  return [
    fabDefaultItem({
      label: "Call us",
      icon: "phone",
      icon_color: "#D85A30",
      action_type: "phone",
      action_value: "",
      phone_source: "page",
    }),
    fabDefaultItem({
      label: "Chat with us",
      icon: "message-circle",
      icon_color: "#1D9E75",
      action_type: "ghl_chat",
      action_value: "",
    }),
  ];
}

export function fabDefaultConfig(): FabConfig {
  return {
    schema_version: FAB_SCHEMA_VERSION,
    enabled: true,
    fab_label: "Contact us",
    show_mobile: true,
    position: "bottom-right",
    offset_x: 18,
    offset_y: 18,
    // OFF by default on the LP fleet: LP form pages are medical (§6 failure mode 7 —
    // no gtag/website-call tracking) and the first-party metrics backend is WP-only
    // today. The <Fab/> treats a missing trackUrl as a no-op. Metrics is a documented
    // v2 that reuses the WP pattern (first-party endpoint on control, never gtag).
    metrics_enabled: false,

    avatar_mode: "wave",
    avatar_initials: "Dr",
    avatar_image_url: "",
    attention_pulse: true,
    attention_bounce: true,
    attention_random_bounce: false,
    show_unread_dot: false,
    show_hover_label: true,
    hover_label_text: "Start Here",

    greeting_text: "Have a question? Call us or start a chat — we're here to help.",
    accent_color: "#132039",
    on_accent_color: "#ffffff",
    card_surface_color: "#ffffff",
    card_text_color: "#1b1b1f",
    card_radius: 20,

    ghl_call_number: "",

    items: fabDefaultItems(),
  };
}

// ── Sanitizer (mirror of class-admin-settings.php::sanitize) ──────────────────

function isHex(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
}
function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}
function str(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  // strip control chars, collapse to a single line, cap length
  return v.replace(/[ -]/g, "").trim().slice(0, max);
}
function bool(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || v === "true";
}
function digitsPhone(v: unknown): string {
  return typeof v === "string" ? v.replace(/[^0-9+\-\s]/g, "").trim().slice(0, 32) : "";
}
function safeUrl(v: unknown): string {
  if (typeof v !== "string") return "";
  const t = v.trim().slice(0, 2048);
  if (t === "") return "";
  // allow http(s), tel, mailto, and root-relative; reject javascript: etc.
  if (/^(https?:\/\/|tel:|mailto:|\/)/i.test(t)) return t;
  return "";
}

export function sanitizeFabItem(row: unknown, defaults: FabConfig): FabItem | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;

  const label = str(r.label, 40);
  if (label === "") return null; // no item ships without a label

  const action_type: FabActionType = FAB_ALLOWED_ACTION_TYPES.includes(
    r.action_type as FabActionType
  )
    ? (r.action_type as FabActionType)
    : "url";

  let action_value = "";
  let phone_source: FabPhoneSource | undefined;
  switch (action_type) {
    case "phone":
      action_value = digitsPhone(r.action_value);
      phone_source = FAB_ALLOWED_PHONE_SOURCES.includes(r.phone_source as FabPhoneSource)
        ? (r.phone_source as FabPhoneSource)
        : "config";
      break;
    case "scroll":
      action_value = str(r.action_value, 200);
      break;
    case "ghl_chat":
      action_value = "";
      break;
    case "url":
    default:
      action_value = safeUrl(r.action_value);
      break;
  }

  const icon: FabIcon = FAB_ALLOWED_ICONS.includes(r.icon as FabIcon)
    ? (r.icon as FabIcon)
    : "message-circle";
  const icon_color = isHex(r.icon_color) ? r.icon_color : "#1D9E75";

  const item: FabItem = {
    label,
    icon,
    icon_color,
    action_type,
    action_value,
    open_new_tab: bool(r.open_new_tab),
    enabled: bool(r.enabled),
  };
  if (phone_source) item.phone_source = phone_source;
  return item;
}

export function sanitizeFabConfig(input: unknown): FabConfig {
  const d = fabDefaultConfig();
  const i = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;

  const fab_label = str(i.fab_label, 40) || d.fab_label;
  const avatar_mode: FabAvatarMode = FAB_ALLOWED_AVATAR_MODES.includes(
    i.avatar_mode as FabAvatarMode
  )
    ? (i.avatar_mode as FabAvatarMode)
    : d.avatar_mode;

  const items: FabItem[] = [];
  if (Array.isArray(i.items)) {
    for (const row of i.items) {
      const clean = sanitizeFabItem(row, d);
      if (clean) items.push(clean);
      if (items.length >= FAB_MAX_ITEMS) break;
    }
  }

  return {
    schema_version: FAB_SCHEMA_VERSION,
    enabled: bool(i.enabled),
    fab_label,
    show_mobile: bool(i.show_mobile),
    position: i.position === "bottom-left" ? "bottom-left" : "bottom-right",
    offset_x: clampInt(i.offset_x, 0, 100, d.offset_x),
    offset_y: clampInt(i.offset_y, 0, 100, d.offset_y),
    metrics_enabled: bool(i.metrics_enabled),

    avatar_mode,
    avatar_initials: str(i.avatar_initials, 2) || d.avatar_initials,
    avatar_image_url: safeUrl(i.avatar_image_url),
    attention_pulse: bool(i.attention_pulse),
    attention_bounce: bool(i.attention_bounce),
    attention_random_bounce: bool(i.attention_random_bounce),
    show_unread_dot: bool(i.show_unread_dot),
    show_hover_label: bool(i.show_hover_label),
    hover_label_text: str(i.hover_label_text, 30) || d.hover_label_text,

    greeting_text: str(i.greeting_text, 160) || d.greeting_text,
    accent_color: isHex(i.accent_color) ? i.accent_color : d.accent_color,
    on_accent_color: isHex(i.on_accent_color) ? i.on_accent_color : d.on_accent_color,
    card_surface_color: isHex(i.card_surface_color) ? i.card_surface_color : d.card_surface_color,
    card_text_color: isHex(i.card_text_color) ? i.card_text_color : d.card_text_color,
    card_radius: clampInt(i.card_radius, 0, 40, d.card_radius),

    ghl_call_number: digitsPhone(i.ghl_call_number),

    // Never persist zero items — the widget must always have at least one.
    items: items.length ? items : d.items,
  };
}

// ── Frontend payload (what the <Fab/> and the journey preview consume) ────────
// Strips disabled items and flattens to the camelCase shape the renderer wants.
// Mirrors class-frontend-widget.php's wp_localize_script payload.

export interface FabFrontendItem {
  label: string;
  icon: FabIcon;
  iconColor: string;
  actionType: FabActionType;
  actionValue: string;
  phoneSource?: FabPhoneSource;
  openNewTab: boolean;
}

export interface FabFrontendPayload {
  enabled: boolean;
  fabLabel: string;
  showMobile: boolean;
  position: FabPosition;
  offsetX: number;
  offsetY: number;
  metricsEnabled: boolean;
  avatarMode: FabAvatarMode;
  avatarInitials: string;
  avatarImageUrl: string;
  attentionPulse: boolean;
  attentionBounce: boolean;
  attentionRandomBounce: boolean;
  showUnreadDot: boolean;
  showHoverLabel: boolean;
  hoverLabelText: string;
  greetingText: string;
  accentColor: string;
  onAccentColor: string;
  cardSurfaceColor: string;
  cardTextColor: string;
  cardRadius: number;
  ghlCallNumber: string;
  items: FabFrontendItem[];
}

export function toFrontendPayload(config: FabConfig): FabFrontendPayload {
  const items: FabFrontendItem[] = config.items
    .filter((it) => it.enabled)
    .map((it) => {
      const fe: FabFrontendItem = {
        label: it.label,
        icon: it.icon,
        iconColor: it.icon_color,
        actionType: it.action_type,
        actionValue: it.action_value,
        openNewTab: it.open_new_tab,
      };
      if (it.action_type === "phone") fe.phoneSource = it.phone_source ?? "config";
      return fe;
    });

  return {
    enabled: config.enabled,
    fabLabel: config.fab_label,
    showMobile: config.show_mobile,
    position: config.position,
    offsetX: config.offset_x,
    offsetY: config.offset_y,
    metricsEnabled: config.metrics_enabled,
    avatarMode: config.avatar_mode,
    avatarInitials: config.avatar_initials,
    avatarImageUrl: config.avatar_image_url,
    attentionPulse: config.attention_pulse,
    attentionBounce: config.attention_bounce,
    attentionRandomBounce: config.attention_random_bounce,
    showUnreadDot: config.show_unread_dot,
    showHoverLabel: config.show_hover_label,
    hoverLabelText: config.hover_label_text,
    greetingText: config.greeting_text,
    accentColor: config.accent_color,
    onAccentColor: config.on_accent_color,
    cardSurfaceColor: config.card_surface_color,
    cardTextColor: config.card_text_color,
    cardRadius: config.card_radius,
    ghlCallNumber: config.ghl_call_number,
    items,
  };
}
