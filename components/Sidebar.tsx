"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

type NavItem = {
  label: string;
  slug?: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    title: "Búsqueda de raíces",
    items: [
      { label: "Búsqueda Binaria", slug: "bisection" },
      { label: "Punto Fijo", slug: "fixed-point" },
      { label: "Newton-Raphson", slug: "newton-raphson" },
      { label: "Aceleración de Aitken", slug: "aitken" },
    ],
  },
  {
    title: "Interpolación",
    items: [{ label: "Interpolación de Lagrange", slug: "lagrange" }],
  },
  {
    title: "Derivación numérica",
    items: [{ label: "Diferencias Divididas / Finitas" }],
  },
  {
    title: "Integración numérica",
    items: [
      { label: "Trapecio Compuesto", slug: "trapezoid" },
      { label: "Regla de Simpson 1/3", slug: "simpson-one-third" },
      { label: "Regla de Simpson 3/8", slug: "simpson-three-eighths" },
      { label: "Rectángulo medio (Cotes)", slug: "midpoint-rectangle" },
      { label: "Método de Monte Carlo" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link href="/" className="brand">
        <span className="brand-mark">∑</span>
        <span className="brand-text">
          <span className="brand-title">Modelado y Simulación</span>
          <span className="brand-subtitle">Ing. Omar Cáceres — Métodos Numéricos</span>
        </span>
      </Link>
      <nav>
        {SECTIONS.map((section) => (
          <div className="nav-group" key={section.title}>
            <div className="nav-section">{section.title}</div>
            <ul>
              {section.items.map((item) => {
                const href = item.slug ? `/models/${item.slug}` : null;
                const isActive = href ? pathname === href : false;
                return (
                  <li key={item.label}>
                    {href ? (
                      <Link href={href} className={isActive ? "is-active" : undefined}>
                        {item.label}
                      </Link>
                    ) : (
                      <span className="nav-disabled" title="Próximamente">
                        {item.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <footer className="sidebar-footer">
        <ThemeToggle />
        <small>Next.js · Python · Vercel</small>
      </footer>
    </aside>
  );
}
