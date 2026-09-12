"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wind } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "GEOSPATIAL INDEX" },
  { href: "#forecast", label: "ATMOSPHERE" },
  { href: "#explainability", label: "INTELLIGENCE" },
  { href: "#model-health", label: "INSTRUMENTATION" },
  { href: "#methodology", label: "ARCHIVE" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(7, 7, 7, 0.92)",
        backdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.10)",
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          padding: "0 1.5rem",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2rem",
        }}
      >
        {/* Brand */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 2,
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Wind size={16} color="var(--air-white)" />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "1.05rem",
                fontWeight: 900,
                color: "var(--air-white)",
                letterSpacing: "0.14em",
                lineHeight: 1,
              }}
            >
              AEROPURE
            </span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "0.55rem",
                fontWeight: 600,
                color: "var(--silver)",
                letterSpacing: "0.18em",
                marginTop: 2,
              }}
            >
              ATMOSPHERIC RESEARCH
            </span>
          </div>
        </Link>

        {/* Nav links — hidden on mobile */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
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
                fontSize: "0.68rem",
                fontFamily: "JetBrains Mono, monospace",
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: pathname === link.href ? "var(--air-white)" : "var(--silver)",
                padding: "0.35rem 0.75rem",
                borderRadius: 2,
                border: pathname === link.href ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.target as HTMLElement;
                el.style.color = "var(--air-white)";
                el.style.borderColor = "rgba(255, 255, 255, 0.25)";
              }}
              onMouseLeave={(e) => {
                const el = e.target as HTMLElement;
                el.style.color = pathname === link.href ? "var(--air-white)" : "var(--silver)";
                el.style.borderColor = pathname === link.href ? "rgba(255,255,255,0.2)" : "transparent";
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <Link
          href="#location-index"
          className="btn-primary-mono"
          style={{
            fontSize: "0.74rem",
            fontFamily: "JetBrains Mono, monospace",
            padding: "0.45rem 1.1rem",
            letterSpacing: "0.12em",
          }}
        >
          SELECT REGION
        </Link>
      </div>
    </header>
  );
}
