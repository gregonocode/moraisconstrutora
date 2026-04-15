type PlanejamentoPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlanejamentoPage({
  params,
}: PlanejamentoPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-white">Planejamento</h1>
      <p className="text-white/70">Módulo de planejamento da obra.</p>
      <div className="rounded-2xl border border-white/10 bg-[#252525] px-4 py-3 text-white/80">
        ID da obra: {id}
      </div>
    </div>
  );
}
