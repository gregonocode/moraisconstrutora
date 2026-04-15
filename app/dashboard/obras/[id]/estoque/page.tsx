type EstoquePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EstoquePage({ params }: EstoquePageProps) {
  const { id } = await params;

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-white">Estoque</h1>
      <p className="text-white/70">Módulo de estoque da obra.</p>
      <div className="rounded-2xl border border-white/10 bg-[#252525] px-4 py-3 text-white/80">
        ID da obra: {id}
      </div>
    </div>
  );
}
