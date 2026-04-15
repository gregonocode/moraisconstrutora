import Link from "next/link";
import {
  ClipboardList,
  HardHat,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";

type ObraPageProps = {
  params: Promise<{ id: string }>;
};

const modulos = [
  {
    titulo: "Planejamento",
    descricao: "Cronograma, etapas e próximos marcos da obra.",
    href: "planejamento",
    icon: ClipboardList,
  },
  {
    titulo: "Diário de obra / RDO",
    descricao: "Registros diários, clima, equipe e ocorrências.",
    href: "rdo",
    icon: HardHat,
  },
  {
    titulo: "Compras",
    descricao: "Solicitações, cotações e acompanhamento de pedidos.",
    href: "compras",
    icon: ShoppingCart,
  },
  {
    titulo: "Estoque",
    descricao: "Materiais, entradas, saídas e saldos da obra.",
    href: "estoque",
    icon: Package,
  },
  {
    titulo: "Equipe",
    descricao: "Equipe operacional vinculada à obra.",
    href: "equipe",
    icon: Users,
  },
];

export default async function ObraPage({ params }: ObraPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-6 lg:space-y-8 lg:p-8">
      <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-5 shadow-2xl sm:rounded-[28px] sm:p-6 lg:rounded-[32px] lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,80,23,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.03),transparent_42%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent_28%,transparent_72%,rgba(255,255,255,0.02))]" />

        <div className="relative z-10 flex flex-col gap-5">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#FF5017]/25 bg-[#FF5017]/10 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF5017]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#FF8A63] sm:text-xs">
              Visão geral da obra
            </p>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
              Obra {id}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/60 sm:text-base">
              Esta é a visão geral da obra. A partir daqui você acessa os módulos
              específicos usando a rota dinâmica da obra.
            </p>
          </div>

        
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modulos.map((modulo) => {
          const Icon = modulo.icon;

          return (
            <Link
              key={modulo.href}
              href={`/dashboard/obras/${id}/${modulo.href}`}
              className="group relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-5 shadow-lg transition hover:bg-[#2a2a2a]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

              <div className="relative z-10">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF5017]/10 text-[#FF8A63]">
                  <Icon className="h-5 w-5" />
                </div>

                <h2 className="mt-4 text-lg font-semibold text-white">
                  {modulo.titulo}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {modulo.descricao}
                </p>

                <p className="mt-4 text-xs font-medium uppercase tracking-[0.12em] text-[#FF8A63]">
                  Abrir módulo
                </p>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
