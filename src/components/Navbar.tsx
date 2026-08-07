import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/trades", label: "Paper Trading" },
  { href: "/journal", label: "Trade Journal" },
  { href: "/analytics", label: "Analytics" },
  { href: "/pricing", label: "Pricing" },
  { href: "/login", label: "Login" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold text-lg">PRO</span>
          <span className="font-bold text-lg">-TRADER</span>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm text-slate-300 sm:gap-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-2 transition-all duration-200 hover:bg-white/10 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
