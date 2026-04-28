import Link from "next/link";
import { MODELS } from "@/lib/models";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">∑</span>
        <span>Modelado y simulación</span>
      </div>
      <nav>
        <ul>
          <li>
            <Link href="/">Inicio</Link>
          </li>
          <li className="nav-section">Modelos disponibles</li>
          {MODELS.map((m) => (
            <li key={m.slug}>
              <Link href={`/models/${m.slug}`}>{m.name}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <footer className="sidebar-footer">
        <small>Next.js · Python · Vercel</small>
      </footer>
    </aside>
  );
}
