import type { ReactNode } from "react";

export function Theory({ slug }: { slug: string }) {
  if (slug === "bisection") return <BisectionTheory />;
  return null;
}

function BisectionTheory() {
  return (
    <section className="theory">
      <h3>Teoría</h3>
      <h4>Pasos del Algoritmo de Bisección</h4>
      <ol className="theory-steps">
        <li>
          <strong>Seleccionar el Intervalo Inicial:</strong> elegí un intervalo
          [<Var>a</Var>, <Var>b</Var>] tal que la función evaluada en los extremos
          tenga signos opuestos, es decir,{" "}
          <Math>
            <Var>f</Var>(<Var>a</Var>) · <Var>f</Var>(<Var>b</Var>) &lt; 0
          </Math>
          . Esto, según el <em>Teorema de Bolzano</em>, garantiza que existe al
          menos una raíz en ese intervalo.
        </li>
        <li>
          <strong>Calcular el Punto Medio:</strong> determiná el punto central
          del intervalo actual usando la fórmula:
          <div className="display-eq">
            <Math>
              <Var>c</Var> ={" "}
              <Frac
                num={
                  <>
                    <Var>a</Var> + <Var>b</Var>
                  </>
                }
                den={<>2</>}
              />
            </Math>
          </div>
        </li>
        <li>
          <strong>Evaluar la Condición de Parada:</strong> verificá si el valor
          de la función en el punto medio (<Math><Var>f</Var>(<Var>c</Var>)</Math>)
          es lo suficientemente cercano a cero, según una tolerancia definida.
          Si es así, <Math><Var>c</Var></Math> es la raíz y el proceso termina.
        </li>
        <li>
          <strong>Actualizar los Límites del Intervalo:</strong>
          <ul className="theory-substeps">
            <li>
              Si{" "}
              <Math>
                <Var>f</Var>(<Var>a</Var>) · <Var>f</Var>(<Var>c</Var>) &lt; 0
              </Math>
              , la raíz está en el sub-intervalo izquierdo [<Var>a</Var>,{" "}
              <Var>c</Var>]. Entonces, actualizá el límite superior haciendo{" "}
              <Math><Var>b</Var> = <Var>c</Var></Math>.
            </li>
            <li>
              Si{" "}
              <Math>
                <Var>f</Var>(<Var>b</Var>) · <Var>f</Var>(<Var>c</Var>) &lt; 0
              </Math>
              , la raíz está en el sub-intervalo derecho [<Var>c</Var>,{" "}
              <Var>b</Var>]. Entonces, actualizá el límite inferior haciendo{" "}
              <Math><Var>a</Var> = <Var>c</Var></Math>.
            </li>
          </ul>
        </li>
        <li>
          <strong>Repetir:</strong> volvé al paso 2 y repetí el proceso con el
          nuevo intervalo reducido hasta alcanzar la precisión o el número de
          iteraciones deseado.
        </li>
      </ol>
    </section>
  );
}

function Var({ children }: { children: ReactNode }) {
  return <em className="math-var">{children}</em>;
}

function Math({ children }: { children: ReactNode }) {
  return <span className="math">{children}</span>;
}

function Frac({ num, den }: { num: ReactNode; den: ReactNode }) {
  return (
    <span className="frac" aria-label="fracción">
      <span className="frac-num">{num}</span>
      <span className="frac-den">{den}</span>
    </span>
  );
}
