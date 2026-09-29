/**
 * IPL Auction building blocks in the site's current design (see Nav.jsx and the
 * Mock RBI panels): obsidian backgrounds, gold accents, slate text, rounded-xl /
 * rounded-2xl glass panels with slate-800 borders, monospace uppercase labels
 * and buttons, Space Grotesk headings (`font-Bebas` in tailwind.config.cjs).
 * Only colours defined in tailwind.config.cjs are used.
 */
import { Link } from "react-router-dom";

export const inputClass =
  "rounded-xl border border-slate-800 bg-obsidian-900 px-3 py-2 font-mono text-sm text-slate-100 placeholder:text-slate-500 " +
  "focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 disabled:opacity-50";

export const table = {
  wrap: "overflow-x-auto rounded-xl border border-slate-800",
  table: "min-w-full text-left text-sm",
  thead: "bg-obsidian-700/70",
  th: "whitespace-nowrap px-3 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400",
  tbody: "divide-y divide-slate-800",
  td: "px-3 py-2",
  highlight: "bg-gold/10",
};

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian-900";

const BUTTON_VARIANTS = {
  primary: "bg-gold text-obsidian-900 shadow-goldGlow enabled:hover:bg-gold-light",
  outline: "border border-gold/50 text-gold enabled:hover:border-gold enabled:hover:bg-gold/10",
  default: "border border-slate-800 bg-obsidian-800 text-slate-300 enabled:hover:border-gold/40 enabled:hover:text-gold",
  danger: "border border-red-500/50 text-red-300 enabled:hover:bg-red-500/10",
};

/** Same looks for links (Tailwind needs every class written out in full). */
const LINK_VARIANTS = {
  primary: "bg-gold text-obsidian-900 shadow-goldGlow hover:bg-gold-light",
  outline: "border border-gold/50 text-gold hover:border-gold hover:bg-gold/10",
  default: "border border-slate-800 bg-obsidian-800 text-slate-300 hover:border-gold/40 hover:text-gold",
};

const BUTTON_SIZES = {
  sm: "px-3 py-1.5 text-[11px]",
  md: "px-4 py-2 text-xs",
  lg: "px-6 py-3 text-sm",
};

const buttonBase = "inline-flex items-center justify-center gap-2 rounded-xl font-mono font-bold uppercase tracking-wider transition-all duration-200";

export function Button({ children, variant = "default", size = "md", className = "", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={`${buttonBase} ${focusRing} disabled:cursor-not-allowed disabled:opacity-40 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** A router link that looks like a Button. */
export function ButtonLink({ children, to, variant = "outline", size = "md", className = "", ...props }) {
  return (
    <Link to={to} className={`${buttonBase} ${focusRing} ${LINK_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`} {...props}>
      {children}
    </Link>
  );
}

/** Full-page frame shared by every IPL Auction screen. */
export function Page({ children, wide = false, className = "" }) {
  return (
    <div className={`relative min-h-screen overflow-x-hidden bg-obsidian-900 font-sans text-slate-100 ${className}`}>
      {/* Ambient backlight, as on the home page */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-gold/5 blur-3xl" aria-hidden="true" />
      <div className={`relative mx-auto px-4 py-5 sm:px-6 lg:px-8 ${wide ? "max-w-[1600px]" : "max-w-7xl"}`}>{children}</div>
    </div>
  );
}

/** Anirveda logo tile (as in the site navbar), event name and page title; `children` sits on the right. */
export function PageHeader({ title, eyebrow = "Anirveda // IPL Auction", children }) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
      <div className="flex min-w-0 items-center gap-4">
        <Link
          to="/"
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold/30 bg-obsidian-900 p-2.5 shadow-goldGlow transition hover:border-gold ${focusRing}`}
          aria-label="Anirveda home"
        >
          <img src="/images/logos/logo_white.webp" alt="Anirveda" className="h-full w-full object-contain" />
        </Link>
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400">{eyebrow}</p>
          <h1 className="truncate font-Bebas text-3xl font-bold uppercase leading-none tracking-tight text-primary sm:text-4xl">{title}</h1>
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-3 text-sm">{children}</div>}
    </header>
  );
}

/** A glass panel with a heading. */
export function Panel({ title, actions, children, className = "", as: Tag = "section" }) {
  return (
    <Tag className={`rounded-2xl border border-slate-800 bg-obsidian-800/80 p-4 shadow-glassGlow backdrop-blur-xl sm:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          {title && <h2 className="font-Bebas text-xl font-bold uppercase tracking-tight text-primary sm:text-2xl">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </Tag>
  );
}

/** Label + value. `accent` shows the value in gold. */
export function StatTile({ label, value, accent = false, hint, className = "" }) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${accent ? "border-gold/40 bg-gold/5" : "border-slate-800 bg-obsidian-900"} ${className}`}>
      <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`font-mono text-xl font-bold leading-tight sm:text-2xl ${accent ? "text-gold" : "text-slate-100"}`}>{value}</div>
      {hint && <div className="font-mono text-[11px] text-slate-500">{hint}</div>}
    </div>
  );
}

const TAG_TONES = {
  default: "border-slate-700 bg-obsidian-900 text-slate-300",
  primary: "border-gold/40 bg-gold/10 text-gold",
  warning: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  success: "border-neon-emerald/50 bg-neon-emerald/10 text-neon-emerald",
  danger: "border-red-500/50 bg-red-500/10 text-red-300",
};

export function Tag({ children, tone = "default", className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${TAG_TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

/** Thin gold rule. */
export function Divider({ className = "" }) {
  return <div className={`mx-auto h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-gold/50 to-transparent ${className}`} aria-hidden="true" />;
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8" role="status">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
      <span className="font-mono text-xs uppercase tracking-wider text-primary motion-safe:animate-pulse">{label}</span>
    </div>
  );
}

export function Empty({ children }) {
  return <p className="font-mono text-xs text-slate-500">{children}</p>;
}

/** Pill tabs, like the events page filters. `tabs`: [{ id, label }]. */
export function Tabs({ tabs, current, onSelect, label, trailing }) {
  return (
    <nav className="mb-5 flex items-center gap-2 overflow-x-auto pb-1" aria-label={label}>
      {tabs.map(({ id, label: text }) => (
        <button
          key={id}
          type="button"
          aria-current={current === id ? "page" : undefined}
          onClick={() => onSelect(id)}
          className={`shrink-0 rounded-xl px-4 py-2 font-mono text-xs tracking-wide transition-all duration-300 ${focusRing} ${
            current === id
              ? "border border-gold/50 bg-gold font-bold text-obsidian-900 shadow-goldGlow"
              : "border border-slate-800 bg-obsidian-800 text-slate-400 hover:border-gold/40 hover:text-gold"
          }`}
        >
          {text}
        </button>
      ))}
      {trailing && <span className="ml-auto whitespace-nowrap pl-3 font-mono text-[11px] uppercase text-slate-400">{trailing}</span>}
    </nav>
  );
}

/** Email + password sign-in, used for admin and team accounts. */
export function SignInPanel({ title, auth, note }) {
  return (
    <Panel title={title}>
      {note && <p className="mb-4 text-sm text-slate-400">{note}</p>}
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          await auth.signIn(String(form.get("email")), String(form.get("password")));
        }}
        className="grid gap-4"
      >
        <label className="grid gap-1.5">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">Email</span>
          <input name="email" required type="email" autoComplete="username" className={`${inputClass} py-2.5`} />
        </label>
        <label className="grid gap-1.5">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">Password</span>
          <input name="password" required type="password" autoComplete="current-password" className={`${inputClass} py-2.5`} />
        </label>
        <Button variant="primary" size="lg" type="submit" disabled={auth.status === "loading"}>
          Sign in
        </Button>
      </form>
      {auth.error && (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-300" role="alert">
          {auth.error}
        </p>
      )}
    </Panel>
  );
}
