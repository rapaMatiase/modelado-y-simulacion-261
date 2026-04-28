import Link from "next/link";
import { MODELS } from "@/lib/models";

export default function Home() {
  return (
    <section className="home">
      <header className="page-header">
        <h2>Modelos numéricos</h2>
        <p className="muted">
          Cada modelo expone parámetros, los resuelve en Python en el servidor y
          devuelve resultados listos para visualizar.
        </p>
      </header>
      <ul className="card-list">
        {MODELS.map((m) => (
          <li key={m.slug} className="card">
            <h3>
              <Link href={`/models/${m.slug}`}>{m.name}</Link>
            </h3>
            <p>{m.description}</p>
            <p className="muted small">
              {m.params.length} parámetro{m.params.length === 1 ? "" : "s"}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
