import Navbar from "@/components/Navbar";
import SearchHero from "@/components/SearchHero";
import ResponsibleAI from "@/components/ResponsibleAI";
import { Wind, Cpu, Database } from "lucide-react";

export const metadata = {
  title: "AeroPure — Know Tomorrow's Air. Today.",
  description: "Search any city and area for AI-powered next-day air quality intelligence. Powered by XGBoost & SHAP explainability.",
};

const FEATURES = [
  {
    icon: <Wind size={24} color="var(--gold)" />,
    title: "24-Hour AI Forecast",
    desc: "XGBoost ML model generates next-day AQI Proxy forecasts across 6 time steps using atmospheric sensor patterns.",
  },
  {
    icon: <Cpu size={24} color="var(--gold)" />,
    title: "SHAP Explainability",
    desc: "Every prediction comes with exact SHAP feature contributions. Understand which pollutants drove the result.",
  },
  {
    icon: <Database size={24} color="var(--gold)" />,
    title: "Drift & Model Health",
    desc: "Population Stability Index (PSI) monitoring detects distribution shifts and flags retraining requirements.",
  },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-void)" }}>
      <Navbar />

      {/* Hero */}
      <section
        style={{
          minHeight: "calc(100dvh - 64px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 1.5rem 2rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background atmospheric glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "15%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            height: 400,
            background: "radial-gradient(ellipse at center, rgba(201,162,39,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Brand wordmark */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              background: "rgba(201,162,39,0.06)",
              border: "1px solid rgba(201,162,39,0.2)",
              borderRadius: 30,
              padding: "0.35rem 1rem 0.35rem 0.7rem",
              marginBottom: "1.5rem",
            }}
          >
            <Wind size={16} color="var(--gold)" />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--gold)" }}>
              AI CLIMATE INTELLIGENCE PLATFORM
            </span>
          </div>

          <h1
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: "clamp(2.8rem, 8vw, 5.5rem)",
              fontWeight: 900,
              color: "var(--gold)",
              letterSpacing: "0.05em",
              lineHeight: 1,
              marginBottom: "0.75rem",
              textShadow: "0 0 60px rgba(212,175,55,0.3)",
            }}
          >
            AEROPURE
          </h1>

          <p
            style={{
              fontSize: "clamp(1.2rem, 3.5vw, 1.8rem)",
              fontWeight: 300,
              color: "var(--text-primary)",
              letterSpacing: "0.02em",
              marginBottom: "0.5rem",
            }}
          >
            Know Tomorrow&apos;s Air.{" "}
            <span style={{ color: "var(--gold)", fontWeight: 600 }}>Today.</span>
          </p>

          <p
            style={{
              fontSize: "clamp(0.88rem, 2vw, 1.05rem)",
              color: "var(--text-muted)",
              maxWidth: 560,
              margin: "0 auto 2.5rem",
              lineHeight: 1.7,
            }}
          >
            Search any supported city and area to explore air-quality intelligence,
            predictive risk, and atmospheric conditions.
          </p>
        </div>

        {/* Search Box */}
        <div
          style={{
            width: "100%",
            maxWidth: 640,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "2rem",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <SearchHero />
        </div>

        {/* Demo mode notice */}
        <p
          style={{
            marginTop: "1.5rem",
            fontSize: "0.75rem",
            color: "var(--text-faint)",
            textAlign: "center",
          }}
        >
          Demo Mode — All forecasts use the validated AeroPure XGBoost ML pipeline.
          Live sensor integration not configured.
        </p>
      </section>

      {/* Feature strip */}
      <section
        style={{
          background: "var(--bg-primary)",
          borderTop: "1px solid var(--border-dim)",
          borderBottom: "1px solid var(--border-dim)",
          padding: "3rem 1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "2rem",
          }}
        >
          {FEATURES.map((f) => (
            <div key={f.title} style={{ display: "flex", gap: "1.2rem", alignItems: "flex-start" }}>
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "0.75rem",
                  flexShrink: 0,
                }}
              >
                {f.icon}
              </div>
              <div>
                <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>{f.title}</p>
                <p style={{ fontSize: "0.83rem", color: "var(--text-muted)", lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem 3rem" }}>
        <ResponsibleAI />
      </section>
    </div>
  );
}
