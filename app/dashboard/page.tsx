import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  ClipboardList,
  DollarSign,
  HardHat,
  Package,
  ShoppingCart,
  TriangleAlert,
  Users,
  Clock,
  MoreVertical,
} from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";

const obrasRecentes = [
  {
    nome: "Residencial Jardim das Flores",
    status: "Em andamento",
    progresso: "64%",
    prazo: "12 Abr 2026",
    statusColor: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  },
  {
    nome: "Condomínio Alto das Palmeiras",
    status: "Planejamento",
    progresso: "18%",
    prazo: "28 Mai 2026",
    statusColor: "text-blue-300 bg-blue-400/10 border-blue-400/20",
  },
  {
    nome: "Reforma Torre Comercial",
    status: "Atenção",
    progresso: "82%",
    prazo: "05 Abr 2026",
    statusColor: "text-orange-200 bg-[#FF5017]/15 border-[#FF5017]/30",
  },
];

const comprasPendentes = [
  {
    item: "Cimento CP II",
    obra: "Jardim das Flores",
    status: "Cotação pendente",
  },
  {
    item: "Vergalhão 10mm",
    obra: "Torre Comercial Centro",
    status: "Aguardando aprovação",
  },
  {
    item: "Brita 1",
    obra: "Alto das Palmeiras",
    status: "Solicitado",
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/dashboard");
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
                Visão geral
              </p>
            </div>

            <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
              Acompanhe suas obras, custos e produtividade.
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-white/60 sm:mt-4 sm:text-base">
              Tenha clareza sobre o andamento da operação, monitorando
              orçamento, compras, equipe e evolução das etapas em tempo real.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:min-w-[360px]">
            <MiniStat label="Obras ativas" value="12" />
            <MiniStat label="Equipe" value="38" />
            <MiniStat label="Alertas" value="5" highlight />
            <MiniStat label="RDO hoje" value="3" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        <StatCard
          icon={<HardHat className="h-5 w-5" />}
          title="Obras em andamento"
          value="08"
          helper="+2 neste mês"
          highlight
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          title="Custo previsto"
          value="R$ 248.900"
          helper="Atualizado hoje"
        />
        <StatCard
          icon={<ShoppingCart className="h-5 w-5" />}
          title="Compras pendentes"
          value="14"
          helper="6 aguardando cotação"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          title="Colaboradores"
          value="38"
          helper="4 novos na semana"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="relative flex flex-col overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

          <div className="relative z-10 mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Obras recentes</h3>
              <p className="text-sm text-white/50">Evolução das frentes ativas.</p>
            </div>
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 active:scale-95 sm:w-auto">
              Ver todas
              <ArrowUpRight className="h-4 w-4 text-white/50" />
            </button>
          </div>

          <div className="relative z-10 flex flex-col gap-3">
            {obrasRecentes.map((obra) => (
              <div
                key={obra.nome}
                className="group rounded-[16px] border border-white/5 bg-white/[0.03] p-4 transition-all hover:bg-white/[0.05] sm:rounded-[20px]"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="line-clamp-1 text-base font-medium text-white">
                    {obra.nome}
                  </h4>
                  <span
                    className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${obra.statusColor}`}
                  >
                    {obra.status}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-white/40">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Prazo: {obra.prazo}</span>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="absolute bottom-0 left-0 top-0 rounded-full bg-gradient-to-r from-[#FF5017] to-[#FF8A63] transition-all duration-500"
                      style={{ width: obra.progresso }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-medium text-white">
                    {obra.progresso}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:gap-6">
          <div className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.07),transparent_42%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_78%)]" />

            <div className="relative z-10 mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#181818]">
                <TriangleAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Alertas rápidos</h3>
                <p className="text-xs text-white/50">Atenção necessária hoje.</p>
              </div>
            </div>

            <div className="relative z-10 flex flex-col gap-2">
              <AlertItem text="2 atividades estão atrasadas no cronograma." />
              <AlertItem text="1 obra ultrapassou o custo previsto da semana." />
              <AlertItem text="3 solicitações aguardam aprovação." />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.06),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_78%)]" />

            <div className="relative z-10 mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#181818]">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white">Compras pendentes</h3>
                <p className="text-xs text-white/50">Aguardando avanço.</p>
              </div>
              <button className="text-white/30 transition-colors hover:text-white">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>

            <div className="relative z-10 flex flex-col gap-2">
              {comprasPendentes.map((compra) => (
                <div
                  key={compra.item}
                  className="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/[0.03] p-3.5 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{compra.item}</p>
                    <p className="text-xs text-white/40">{compra.obra}</p>
                  </div>
                  <p className="mt-2 text-[11px] font-medium text-[#FF8A63] sm:mt-0 sm:text-right">
                    {compra.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-6">
        <SmallInfoCard
          icon={<ClipboardList className="h-5 w-5" />}
          title="RDOs finalizados"
          text="12 registros concluídos nos últimos 7 dias."
        />
        <SmallInfoCard
          icon={<Package className="h-5 w-5" />}
          title="Estoque crítico"
          text="4 materiais abaixo do estoque mínimo."
        />
        <SmallInfoCard
          icon={<Users className="h-5 w-5" />}
          title="Equipe na obra"
          text="38 colaboradores em 3 frentes."
        />
      </section>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  helper,
  highlight = false,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  helper: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[20px] border p-4 shadow-lg transition-all hover:-translate-y-1 sm:rounded-[24px] sm:p-5 ${
        highlight
          ? "border-[#FF5017]/40 bg-[#FF5017]"
          : "border-white/5 bg-[#252525]"
      }`}
    >
      <div
        className={`absolute inset-0 ${
          highlight
            ? "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_38%),linear-gradient(to_bottom,rgba(255,255,255,0.06),transparent_32%,transparent_72%,rgba(0,0,0,0.05))]"
            : "bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_38%),linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_30%,transparent_72%,rgba(255,255,255,0.015))]"
        }`}
      />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p
            className={`text-sm font-medium ${
              highlight ? "text-white/80" : "text-white/50"
            }`}
          >
            {title}
          </p>
          <h3 className="mt-1 text-2xl font-bold text-white sm:mt-2">{value}</h3>
          <p
            className={`mt-1 text-xs font-medium ${
              highlight ? "text-white/80" : "text-[#FF8A63]"
            }`}
          >
            {helper}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#080808] sm:h-12 sm:w-12">
          {icon}
        </div>
      </div>
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

function AlertItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-3 text-sm text-white/70">
      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF5017]/50" />
      <span className="leading-snug">{text}</span>
    </div>
  );
}

function SmallInfoCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[24px] sm:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.06),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_75%)]" />

      <div className="relative z-10 flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#080808]">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white sm:text-base">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-white/50 sm:text-sm">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}