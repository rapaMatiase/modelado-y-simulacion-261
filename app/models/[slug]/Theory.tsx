import type { ReactNode } from "react";

export function Theory({ slug }: { slug: string }) {
  if (slug === "bisection") return <BisectionTheory />;
  if (slug === "fixed-point") return <FixedPointTheory />;
  if (slug === "newton-raphson") return <NewtonRaphsonTheory />;
  if (slug === "aitken") return <AitkenTheory />;
  if (slug === "lagrange") return <LagrangeTheory />;
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

function FixedPointTheory() {
  return (
    <section className="theory">
      <h3>Teoría</h3>
      <h4>Paso a Paso del Método del Punto Fijo</h4>
      <ol className="theory-steps">
        <li>
          <strong>Transformar la ecuación:</strong> partiendo de la función
          original <Math><Var>f</Var>(<Var>x</Var>) = 0</Math>, despejá una{" "}
          <Var>x</Var> para obtener la forma:
          <div className="display-eq">
            <Math>
              <Var>x</Var> = <Var>g</Var>(<Var>x</Var>)
            </Math>
          </div>
          Puede haber varias formas de despejar <Var>x</Var>, pero no todas
          servirán para que el método converja.
        </li>
        <li>
          <strong>Elegir un valor inicial (<Math><Var>x</Var><Sub>0</Sub></Math>):</strong>{" "}
          seleccioná un punto de partida que esté cerca de donde sospechás que
          está la raíz.
        </li>
        <li>
          <strong>Proceso Iterativo:</strong> aplicá la fórmula de recurrencia
          para obtener las siguientes aproximaciones:
          <div className="display-eq">
            <Math>
              <Var>x</Var><Sub>1</Sub> = <Var>g</Var>(<Var>x</Var><Sub>0</Sub>),{" "}
              <Var>x</Var><Sub>2</Sub> = <Var>g</Var>(<Var>x</Var><Sub>1</Sub>),{" "}
              <Var>x</Var><Sub>3</Sub> = <Var>g</Var>(<Var>x</Var><Sub>2</Sub>), …
            </Math>
          </div>
          y, en general,{" "}
          <Math>
            <Var>x</Var><Sub>i+1</Sub> = <Var>g</Var>(<Var>x</Var><Sub>i</Sub>)
          </Math>
          .
        </li>
        <li>
          <strong>Criterio de Convergencia (Condición de Taylor):</strong> para
          saber si el método va a llegar a la raíz, en el intervalo de búsqueda
          se debe cumplir:
          <div className="display-eq">
            <Math>
              | <Var>g</Var>′(<Var>x</Var>) | &lt; 1
            </Math>
          </div>
          Si el valor absoluto de la derivada es menor a 1, el método{" "}
          <em>converge</em>. Si es mayor, el método <em>diverge</em>.
        </li>
        <li>
          <strong>Control de Error y Detención:</strong> en cada paso, calculá
          el error para saber cuándo parar:
          <ul className="theory-substeps">
            <li>
              <strong>Error absoluto:</strong>{" "}
              <Math>
                | <Var>x</Var><Sub>i+1</Sub> − <Var>x</Var><Sub>i</Sub> | &lt; ε
              </Math>
            </li>
            <li>
              <strong>Error relativo:</strong>{" "}
              <Math>
                <Frac
                  num={
                    <>
                      | <Var>x</Var><Sub>i+1</Sub> − <Var>x</Var><Sub>i</Sub> |
                    </>
                  }
                  den={
                    <>
                      | <Var>x</Var><Sub>i+1</Sub> |
                    </>
                  }
                />{" "}
                &lt; ε
              </Math>
            </li>
          </ul>
          O detenerse al alcanzar el número máximo de iteraciones permitido.
        </li>
      </ol>
      <h4>Resumen Visual</h4>
      <p>
        El método busca la intersección entre la recta{" "}
        <Math>
          <Var>y</Var> = <Var>x</Var>
        </Math>{" "}
        y la curva de la función despejada{" "}
        <Math>
          <Var>y</Var> = <Var>g</Var>(<Var>x</Var>)
        </Math>
        .
      </p>
    </section>
  );
}

function NewtonRaphsonTheory() {
  return (
    <section className="theory">
      <h3>Teoría</h3>
      <h4>Método de Newton-Raphson</h4>
      <p>
        Se usa para encontrar la raíz de una función{" "}
        <Math>
          <Var>f</Var>(<Var>x</Var>) = 0
        </Math>{" "}
        mediante una aproximación lineal (tangentes).
      </p>
      <h4>Paso a Paso</h4>
      <ol className="theory-steps">
        <li>
          <strong>Definir la función y su derivada:</strong> tenés que conocer{" "}
          <Math>
            <Var>f</Var>(<Var>x</Var>)
          </Math>{" "}
          y calcular analíticamente su derivada{" "}
          <Math>
            <Var>f</Var>′(<Var>x</Var>)
          </Math>
          .
        </li>
        <li>
          <strong>
            Elegir un valor inicial (
            <Math>
              <Var>x</Var>
              <Sub>n</Sub>
            </Math>
            ):
          </strong>{" "}
          seleccioná un punto de partida lo más cerca posible de la raíz
          sospechada.
        </li>
        <li>
          <strong>Aplicar la fórmula iterativa:</strong> calculá el siguiente
          valor (
          <Math>
            <Var>x</Var>
            <Sub>n+1</Sub>
          </Math>
          ) usando la pendiente de la tangente:
          <div className="display-eq">
            <Math>
              <Var>x</Var>
              <Sub>n+1</Sub> = <Var>x</Var>
              <Sub>n</Sub> −{" "}
              <Frac
                num={
                  <>
                    <Var>f</Var>(<Var>x</Var>
                    <Sub>n</Sub>)
                  </>
                }
                den={
                  <>
                    <Var>f</Var>′(<Var>x</Var>
                    <Sub>n</Sub>)
                  </>
                }
              />
            </Math>
          </div>
        </li>
        <li>
          <strong>Verificar condiciones críticas:</strong>
          <ul className="theory-substeps">
            <li>
              Si{" "}
              <Math>
                <Var>f</Var>′(<Var>x</Var>
                <Sub>n</Sub>) = 0
              </Math>
              , el método falla (división por cero).
            </li>
            <li>
              Si el punto inicial está muy lejos, el método puede{" "}
              <em>diverger</em>.
            </li>
          </ul>
        </li>
        <li>
          <strong>Control de parada:</strong> repetí el proceso hasta que la
          diferencia entre iteraciones sea menor a la tolerancia{" "}
          <Math>
            ( |<Var>x</Var>
            <Sub>n+1</Sub> − <Var>x</Var>
            <Sub>n</Sub>| &lt; ε )
          </Math>{" "}
          o alcances el máximo de iteraciones.
        </li>
      </ol>
    </section>
  );
}

function AitkenTheory() {
  return (
    <section className="theory">
      <h3>Teoría</h3>
      <h4>Proceso Δ² de Aitken</h4>
      <p>
        Este no es un método para buscar raíces desde cero, sino una técnica
        para <strong>acelerar una secuencia que ya está convergiendo
        lentamente</strong> (como la del Punto Fijo).
      </p>
      <h4>Paso a Paso</h4>
      <ol className="theory-steps">
        <li>
          <strong>Generar tres valores consecutivos:</strong> necesitás tres
          aproximaciones sucesivas de tu método actual:{" "}
          <Math>
            <Var>x</Var>
            <Sub>n</Sub>, <Var>x</Var>
            <Sub>n+1</Sub>, <Var>x</Var>
            <Sub>n+2</Sub>
          </Math>
          .
        </li>
        <li>
          <strong>Calcular las diferencias (Deltas):</strong>
          <div className="display-eq">
            <Math>
              Δ<Var>x</Var>
              <Sub>n</Sub> = <Var>x</Var>
              <Sub>n+1</Sub> − <Var>x</Var>
              <Sub>n</Sub>
            </Math>
          </div>
          <div className="display-eq">
            <Math>
              Δ²<Var>x</Var>
              <Sub>n</Sub> = <Var>x</Var>
              <Sub>n+2</Sub> − 2<Var>x</Var>
              <Sub>n+1</Sub> + <Var>x</Var>
              <Sub>n</Sub>
            </Math>
          </div>
        </li>
        <li>
          <strong>Aplicar el "Salto Predictivo":</strong> usá la fórmula de
          Aitken para calcular una mejor aproximación{" "}
          <Math>x̂</Math>:
          <div className="display-eq">
            <Math>
              x̂ = <Var>x</Var>
              <Sub>n</Sub> −{" "}
              <Frac
                num={
                  <>
                    (Δ<Var>x</Var>
                    <Sub>n</Sub>)²
                  </>
                }
                den={
                  <>
                    Δ²<Var>x</Var>
                    <Sub>n</Sub>
                  </>
                }
              />
            </Math>
          </div>
          También se puede expresar como:
          <div className="display-eq">
            <Math>
              x̂ = <Var>x</Var>
              <Sub>n</Sub> −{" "}
              <Frac
                num={
                  <>
                    (<Var>x</Var>
                    <Sub>n+1</Sub> − <Var>x</Var>
                    <Sub>n</Sub>)²
                  </>
                }
                den={
                  <>
                    <Var>x</Var>
                    <Sub>n+2</Sub> − 2<Var>x</Var>
                    <Sub>n+1</Sub> + <Var>x</Var>
                    <Sub>n</Sub>
                  </>
                }
              />
            </Math>
          </div>
        </li>
        <li>
          <strong>Resultado:</strong> el valor obtenido <Math>x̂</Math> suele
          estar mucho más cerca del límite final que los tres valores
          originales, ahorrando muchas iteraciones intermedias.
        </li>
      </ol>
    </section>
  );
}

function LagrangeTheory() {
  return (
    <section className="theory">
      <h3>Teoría</h3>
      <h4>Polinomio Interpolante de Lagrange</h4>
      <ol className="theory-steps">
        <li>
          <strong>Organizar los datos:</strong> identificá los puntos{" "}
          <Math>
            (<Var>x</Var>
            <Sub>0</Sub>, <Var>y</Var>
            <Sub>0</Sub>), (<Var>x</Var>
            <Sub>1</Sub>, <Var>y</Var>
            <Sub>1</Sub>), …, (<Var>x</Var>
            <Sub>n</Sub>, <Var>y</Var>
            <Sub>n</Sub>)
          </Math>
          . Todos los <Var>x</Var> deben ser distintos. El grado del polinomio
          será, como máximo, <Math>n − 1</Math>.
        </li>
        <li>
          <strong>Estructura general:</strong> el polinomio final se construye
          como una suma ponderada de los <Math><Var>y</Var></Math>:
          <div className="display-eq">
            <Math>
              <Var>P</Var>(<Var>x</Var>) = Σ <Var>y</Var>
              <Sub>i</Sub> · <Var>L</Var>
              <Sub>i</Sub>(<Var>x</Var>)
            </Math>
          </div>
        </li>
        <li>
          <strong>Calcular los polinomios base (<Math><Var>L</Var><Sub>i</Sub></Math>):</strong>{" "}
          cada <Math><Var>L</Var><Sub>i</Sub></Math> debe valer 1 cuando{" "}
          <Math><Var>x</Var> = <Var>x</Var><Sub>i</Sub></Math> y 0 en los demás
          puntos:
          <div className="display-eq">
            <Math>
              <Var>L</Var>
              <Sub>i</Sub>(<Var>x</Var>) = Π<Sub>j≠i</Sub>{" "}
              <Frac
                num={
                  <>
                    <Var>x</Var> − <Var>x</Var>
                    <Sub>j</Sub>
                  </>
                }
                den={
                  <>
                    <Var>x</Var>
                    <Sub>i</Sub> − <Var>x</Var>
                    <Sub>j</Sub>
                  </>
                }
              />
            </Math>
          </div>
          <ul className="theory-substeps">
            <li>
              <strong>Numerador:</strong> producto de{" "}
              <Math>(<Var>x</Var> − <Var>x</Var><Sub>j</Sub>)</Math> para todos
              los puntos excepto el actual. Garantiza que el polinomio se haga
              cero en los demás.
            </li>
            <li>
              <strong>Denominador:</strong> reemplazás la <Var>x</Var> del
              numerador por <Math><Var>x</Var><Sub>i</Sub></Math>. Garantiza que
              el resultado sea 1 cuando se evalúa en{" "}
              <Math><Var>x</Var><Sub>i</Sub></Math>.
            </li>
          </ul>
        </li>
        <li>
          <strong>Armar el polinomio:</strong> multiplicá cada{" "}
          <Math><Var>L</Var><Sub>i</Sub>(<Var>x</Var>)</Math> por su{" "}
          <Math><Var>y</Var><Sub>i</Sub></Math> y sumá:
          <div className="display-eq">
            <Math>
              <Var>P</Var>(<Var>x</Var>) = <Var>y</Var>
              <Sub>0</Sub>
              <Var>L</Var>
              <Sub>0</Sub>(<Var>x</Var>) + <Var>y</Var>
              <Sub>1</Sub>
              <Var>L</Var>
              <Sub>1</Sub>(<Var>x</Var>) + … + <Var>y</Var>
              <Sub>n</Sub>
              <Var>L</Var>
              <Sub>n</Sub>(<Var>x</Var>)
            </Math>
          </div>
        </li>
        <li>
          <strong>Simplificar (opcional):</strong> dejarlo en forma de Lagrange
          o expandir y agrupar términos para llegar a la forma estándar{" "}
          <Math>
            <Var>a</Var>
            <Var>x</Var>
            <Sub>n</Sub> + <Var>b</Var>
            <Var>x</Var>
            <Sub>n−1</Sub> + …
          </Math>
          .
        </li>
        <li>
          <strong>Evaluar:</strong> reemplazar la <Var>x</Var> en{" "}
          <Math><Var>P</Var>(<Var>x</Var>)</Math> por el valor deseado para
          predecir un valor intermedio.
        </li>
      </ol>
      <h4>Ejemplo rápido con 3 puntos</h4>
      <p>
        Puntos: <Math>(1, 2), (2, 3), (4, 5)</Math>.
      </p>
      <div className="display-eq">
        <Math>
          <Var>L</Var>
          <Sub>0</Sub>(<Var>x</Var>) ={" "}
          <Frac
            num={<>(<Var>x</Var>−2)(<Var>x</Var>−4)</>}
            den={<>(1−2)(1−4)</>}
          />
        </Math>
      </div>
      <div className="display-eq">
        <Math>
          <Var>L</Var>
          <Sub>1</Sub>(<Var>x</Var>) ={" "}
          <Frac
            num={<>(<Var>x</Var>−1)(<Var>x</Var>−4)</>}
            den={<>(2−1)(2−4)</>}
          />
        </Math>
      </div>
      <div className="display-eq">
        <Math>
          <Var>L</Var>
          <Sub>2</Sub>(<Var>x</Var>) ={" "}
          <Frac
            num={<>(<Var>x</Var>−1)(<Var>x</Var>−2)</>}
            den={<>(4−1)(4−2)</>}
          />
        </Math>
      </div>
      <div className="display-eq">
        <Math>
          <Var>P</Var>(<Var>x</Var>) = 2 · <Var>L</Var>
          <Sub>0</Sub> + 3 · <Var>L</Var>
          <Sub>1</Sub> + 5 · <Var>L</Var>
          <Sub>2</Sub>
        </Math>
      </div>
    </section>
  );
}

function Sub({ children }: { children: ReactNode }) {
  return <sub className="math-sub">{children}</sub>;
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
