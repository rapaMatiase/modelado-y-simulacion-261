import { notFound } from "next/navigation";
import { MODELS, getModel } from "@/lib/models";
import { ModelRunner } from "./ModelRunner";
import { Theory } from "./Theory";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return MODELS.map((m) => ({ slug: m.slug }));
}

export default async function ModelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const model = getModel(slug);
  if (!model) notFound();

  return (
    <article className="model-page">
      <header className="page-header">
        <h2>{model.name}</h2>
        <p className="muted">{model.description}</p>
      </header>
      <ModelRunner model={model} />
      <Theory slug={slug} />
    </article>
  );
}
