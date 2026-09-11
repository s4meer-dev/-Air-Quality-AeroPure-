import Link from "next/link";
import { MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-void)",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <MapPin size={48} color="var(--gold-dim)" style={{ marginBottom: "1.5rem", opacity: 0.5 }} />
      <h1
        style={{
          fontFamily: "Orbitron, sans-serif",
          fontSize: "1.4rem",
          fontWeight: 700,
          color: "var(--gold)",
          letterSpacing: "0.08em",
          marginBottom: "0.75rem",
        }}
      >
        LOCATION NOT FOUND
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", maxWidth: 440, lineHeight: 1.7, marginBottom: "1.5rem" }}>
        This city or area is not currently in the AeroPure supported locations registry.
        Only validated locations with registered atmospheric baselines are available in Demo Mode.
      </p>
      <Link href="/" className="btn-gold">
        ← Search Supported Cities
      </Link>
    </div>
  );
}
