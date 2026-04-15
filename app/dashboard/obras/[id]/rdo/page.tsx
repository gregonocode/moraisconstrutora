type RdoPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RdoPage({ params }: RdoPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-white">Diário de obra / RDO</h1>
      <p className="text-white/70">Módulo de diário de obra da obra.</p>
      <div className="rounded-2xl border border-white/10 bg-[#252525] px-4 py-3 text-white/80">
        ID da obra: {id}
      </div>
    </div>
  );
}
