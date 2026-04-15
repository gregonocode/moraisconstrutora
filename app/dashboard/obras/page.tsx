import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ClipboardList,
  HardHat,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";

const obras = [
  {
    id: "obra-jardim-das-flores",
    nome: "Residencial Jardim das Flores",
    status: "Em andamento",
    etapa: "Estrutura e alvenaria",
    progresso: "64%",
  },
  {
    id: "obra-alto-das-palmeiras",
    nome: "Condomínio Alto das Palmeiras",
    status: "Planejamento",
    etapa: "Compatibilização de projetos",
    progresso: "18%",
  },
  {
    id: "obra-torre-comercial",
    nome: "Reforma Torre Comercial",
    status: "Atenção",
    etapa: "Acabamentos e compras críticas",
    progresso: "82%",
  },
];

const modulos = [
  { label: "Planejamento", rota: "planejamento", icon: <ClipboardList className="h-5 w-5" /> },
  { label: "RDO", rota: "rdo", icon: <HardHat className="h-5 w-5" /> },
  { label: "Compras", rota: "compras", icon: <ShoppingCart className="h-5 w-5" /> },
  { label: "Estoque", rota: "estoque", icon: <Package className="h-5 w-5" /> },
  { label: "Equipe", rota: "equipe", icon: <Users className="h-5 w-5" /> },
];

export default async function ObrasPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/dashboard/obras");
  }

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-6 lg:space-y-8 lg:p-8">
      <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-5 shadow-2xl sm:rounded-[28px] sm:p-6 lg:rounded-[32px] lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,80,23,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.03),transparent_42%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent_28%,transparent_72%,rgba(255,255,255,0.02))]" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FF5017]/25 bg-[#FF5017]/10 px-3 py-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF5017]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#FF8A63] sm:text-xs">
                Gestão de obras
              </p>
            </div>

            <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
              Obras
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-white/60 sm:mt-4 sm:text-base">
              Selecione uma obra para acessar seus módulos de planejamento,
              diário de obra, compras, estoque e equipe.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[360px]">
            <MiniStat label="Obras" value={String(obras.length)} />
            <MiniStat label="Ativas" value="2" />
            <MiniStat label="Módulos" value="5" highlight />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

          <div className="relative z-10">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">Listagem de obras</h2>
              <p className="text-sm text-white/50">
                Acesse cada obra pelo identificador da rota dinâmica.
              </p>
            </div>

            <div className="space-y-3">
              {obras.map((obra) => (
                <Link
                  key={obra.id}
                  href={`/dashboard/obras/${obra.id}`}
                  className="group block rounded-[20px] border border-white/5 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-white">{obra.nome}</p>
                      <p className="mt-1 text-sm text-white/50">ID da obra: {obra.id}</p>
                      <p className="mt-3 text-sm text-white/65">{obra.etapa}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-[#FF5017]/20 bg-[#FF5017]/10 px-3 py-1 text-xs font-medium text-[#FF8A63]">
                        {obra.status}
                      </span>
                      <ArrowRight className="h-4 w-4 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white/70" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#FF5017] to-[#FF8A63]"
                        style={{ width: obra.progresso }}
                      />
                    </div>
                    <span className="text-xs font-medium text-white/70">{obra.progresso}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

          <div className="relative z-10">
            <h2 className="text-lg font-semibold text-white">Módulos por obra</h2>
            <p className="text-sm text-white/50">
              Estrutura preparada para navegação por obra específica.
            </p>

            <div className="mt-5 space-y-3">
              {modulos.map((modulo) => (
                <div
                  key={modulo.rota}
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FF5017]/10 text-[#FF8A63]">
                    {modulo.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{modulo.label}</p>
                    <p className="text-xs text-white/45">
                      `/dashboard/obras/[id]/{modulo.rota}`
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-3 py-2.5 sm:px-4 sm:py-3 ${
        highlight
          ? "border-[#FF5017]/30 bg-[#FF5017]/10"
          : "border-white/5 bg-white/[0.04]"
      }`}
    >
      <p className="text-[11px] font-medium text-white/50 sm:text-xs">{label}</p>
      <p
        className={`mt-0.5 text-lg font-bold sm:text-xl ${
          highlight ? "text-[#FF8A63]" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
