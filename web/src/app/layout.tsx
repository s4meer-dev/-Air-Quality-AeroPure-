import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AeroPure — AI Air Quality Intelligence Platform",
  description:
    "Know tomorrow's air quality today. City-scale predictive air intelligence powered by XGBoost & SHAP explainability.",
  keywords: ["air quality", "AQI", "air pollution", "forecast", "AI", "machine learning"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
