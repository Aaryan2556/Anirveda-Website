/**
 * IPL Auction building blocks, styled after the rest of the Anirveda site:
 * black / tertiary backgrounds, Bebas Neue headings in the primary gold, Abel
 * and Lato body text in the secondary tan, rounded-3xl pill buttons and thin
 * secondary borders. Only existing Tailwind tokens (tailwind.config.cjs) are used.
 */
import { Link } from "react-router-dom";

export const inputClass =
  "rounded-md border border-secondary/40 bg-black px-3 py-1.5 text-sm text-white placeholder:text-secondary/50 " +
  "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50";

export const table = {
  wrap: "overflow-x-auto rounded-lg border border-secondary/20",
  table: "min-w-full text-left text-sm",
  thead: "bg-secondary/10",
  th: "whitespace-nowrap px-3 py-2 text-xs font-medium uppercase tracking-wider text-secondary",
  tbody: "divide-y divide-secondary/15",
  td: "px-3 py-2",
  highlight: "bg-primary/10",
};

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black";

const BUTTON_VARIANTS = {
  primary: "border-2 border-primary bg-primary text-white enabled:hover:bg-transparent enabled:hover:text-primary",
  outline: "border border-primary text-primary enabled:hover:bg-primary enabled:hover:text-white",
  default: "border border-secondary/40 text-secondary enabled:hover:border-primary enabled:hover:text-primary",
  danger: "border border-red-500/60 text-red-300 enabled:hover:bg-red-600 enabled:hover:text-white",
};

/** Same looks for links (Tailwind needs every class written out in full). */
const LINK_VARIANTS = {
  primary: "border-2 border-primary bg-primary text-white hover:bg-transparent hover:text-primary",
  outline: "border border-primary text-primary hover:bg-primary hover:text-white",
  default: "border border-secondary/40 text-secondary hover:border-primary hover:text-primary",
};

const BUTTON_SIZES = {
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-1.5 text-sm",
  lg: "px-6 py-2.5 text-base font-bold",
};

export function Button({ children, variant = "default", size = "md", className = "", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-3xl transition duration-200 ${focusRing} disabled:cursor-not-allowed disabled:opacity-40 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** A router link that looks like a Button. */
export function ButtonLink({ children, to, variant = "outline", size = "md", className = "", ...props }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center gap-2 rounded-3xl transition duration-200 ${focusRing} ${LINK_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

/** Full-page frame shared by every IPL Auction screen. */
export function Page({ children, wide = false, className = "" }) {
  return (
    <div className={`min-h-screen bg-black font-Lato text-white ${className}`}>
      <div className={`mx-auto px-4 py-5 sm:px-6 lg:px-8 ${wide ? "max-w-[1600px]" : "max-w-7xl"}`}>{children}</div>
    </div>
  );
}

/** Anirveda logo, event name and the page title; `children` sits on the right. */
export function PageHeader({ title, eyebrow = "Anirveda · IPL Auction", children }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-secondary/20 pb-4">
      <div className="flex min-w-0 items-center gap-4">
        <Link to="/" className={`w-12 shrink-0 sm:w-14 ${focusRing}`} aria-label="Anirveda home">
          <img src="/images/logos/logo_white.webp" alt="Anirveda" />
        </Link>
        <div className="min-w-0">
          <p className="font-Abel text-xs uppercase tracking-[0.25em] text-secondary sm:text-sm">{eyebrow}</p>
          <h1 className="truncate font-Bebas text-4xl leading-none tracking-wide text-primary sm:text-5xl">{title}</h1>
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-3 text-sm">{children}</div>}
    </header>
  );
}

/** A bordered section with a Bebas title. */
export function Panel({ title, actions, children, className = "", as: Tag = "section" }) {
  return (
    <Tag className={`rounded-lg border border-secondary/30 bg-tertiary p-4 sm:p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="font-Bebas text-2xl leading-none tracking-wide text-primary">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </Tag>
  );
}

/** Label + value. `accent` shows the value in the primary colour. */
export function StatTile({ label, value, accent = false, hint, className = "" }) {
  return (
    <div className={`rounded-lg border border-secondary/20 bg-secondary-15 px-3 py-2 ${className}`}>
      <div className="text-[10px] font-medium uppercase tracking-wider text-secondary">{label}</div>
      <div className={`font-Bebas text-3xl leading-tight tracking-wide ${accent ? "text-primary" : "text-white"}`}>{value}</div>
      {hint && <div className="text-xs text-secondary/70">{hint}</div>}
    </div>
  );
}

const TAG_TONES = {
  default: "border-secondary/40 text-secondary",
  primary: "border-primary/60 bg-primary/15 text-primary",
  warning: "border-yellow-500/60 bg-yellow-500/10 text-yellow-200",
  success: "border-green-500/50 bg-green-500/10 text-green-300",
  danger: "border-red-500/50 bg-red-500/10 text-red-300",
};

export function Tag({ children, tone = "default", className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-3xl border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${TAG_TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

/** The site's gold rule with a ❖ in the middle. */
export function Divider({ className = "" }) {
  return (
    <div className={`flex items-center justify-center ${className}`} aria-hidden="true">
      <div className="h-px w-1/4 bg-primary" />
      <span className="mx-4 text-xl text-primary">❖</span>
      <div className="h-px w-1/4 bg-primary" />
    </div>
  );
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-3 py-6 text-secondary" role="status">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Empty({ children }) {
  return <p className="text-sm text-secondary/70">{children}</p>;
}

/** Underlined section tabs. `tabs`: [{ id, label }]. */
export function Tabs({ tabs, current, onSelect, label, trailing }) {
  return (
    <nav className="mb-5 flex gap-1 overflow-x-auto border-b border-secondary/20" aria-label={label}>
      {tabs.map(({ id, label: text }) => (
        <button
          key={id}
          type="button"
          aria-current={current === id ? "page" : undefined}
          onClick={() => onSelect(id)}
          className={`-mb-px shrink-0 border-b-2 px-3 pb-2 pt-1 font-Bebas text-xl tracking-wide transition ${focusRing} ${
            current === id ? "border-primary text-primary" : "border-transparent text-secondary hover:text-white"
          }`}
        >
          {text}
        </button>
      ))}
      {trailing && <span className="ml-auto self-center whitespace-nowrap pl-3 text-xs text-secondary">{trailing}</span>}
    </nav>
  );
}
