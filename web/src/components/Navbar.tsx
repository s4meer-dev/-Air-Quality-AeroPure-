"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wind } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "CITY SEARCH" },
  { href: "#forecast", label: "FORECAST" },
  { href: "#explainability", label: "INTELLIGENCE" },
  { href: "#model-health", label: "MODEL HEALTH" },
  { href: "#methodology", label: "METHODOLOGY" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(5,5,5,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid #1e1e1e",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 1.5rem",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2rem",
        }}
      >
        {/* Brand */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Wind size={22} color="var(--gold)" />
          <span
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--gold)",
              letterSpacing: "0.12em",
            }}
          >
            AEROPURE
          </span>
        </Link>

        {/* Nav links — hidden on mobile */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            flex: 1,
            justifyContent: "center",
          }}
          className="hidden-mobile"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: pathname === link.href ? "var(--gold)" : "var(--text-muted)",
                padding: "0.4rem 0.8rem",
                borderRadius: 6,
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--gold-bright)")}
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.color =
                  pathname === link.href ? "var(--gold)" : "var(--text-muted)")
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <Link href="/" className="btn-gold" style={{ fontSize: "0.78rem", padding: "0.5rem 1.2rem" }}>
          CHECK AIR
        </Link>
      </div>
    </header>
  );
}
