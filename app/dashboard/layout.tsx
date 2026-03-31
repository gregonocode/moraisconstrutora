// app/dashboard/layout.tsx
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ChevronRight,
  ClipboardList,
  FolderKanban,
  HardHat,
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Users,
} from "lucide-react";
import { DashboardLogoutButton } from "@/app/components/DashboardLogoutButton";

type DashboardLayoutProps = {
  children: ReactNode;
};

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Obras",
    href: "/dashboard/obras",
    icon: HardHat,
  },
  {
    label: "Orçamentos",
    href: "/dashboard/orcamentos",
    icon: Receipt,
  },
  {
    label: "Planejamento",
    href: "/dashboard/planejamento",
    icon: FolderKanban,
  },
  {
    label: "Diário de Obra",
    href: "/dashboard/rdo",
    icon: ClipboardList,
  },
  {
    label: "Compras",
    href: "/dashboard/compras",
    icon: ShoppingCart,
  },
  {
    label: "Estoque",
    href: "/dashboard/estoque",
    icon: Package,
  },
  {
    label: "Equipe",
    href: "/dashboard/equipe",
    icon: Users,
  },
];

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#0b0b0c] text-white">
      <div className="flex min-h-dvh w-full overflow-x-hidden">
        {/* Sidebar desktop */}
        <aside className="hidden w-[290px] shrink-0 border-r border-white/8 bg-[#0f0f10] lg:flex lg:flex-col">
          <div className="relative overflow-hidden border-b border-white/8 px-6 py-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,96,26,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,96,26,0.08),transparent_30%)]" />

            <div className="relative z-10">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                  Plataforma
                </p>

                <div className="mt-3 flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-lg" />
                    <img
                      src="/logomorais.svg"
                      alt="Morais Construtora"
                      className="relative h-12 w-auto"
                    />
                  </div>

                  <div className="min-w-0">
                    <h1 className="text-2xl font-black leading-none text-white">
                      Brick Morais
                    </h1>
                    <p className="mt-1 text-sm text-white/60">
                      Gestão de obras
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.18em] text-orange-400">
                  Ambiente
                </p>
                <h2 className="mt-2 text-lg font-semibold text-white">
                  Gestão de Obras
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/55">
                  Controle completo da operação, equipes, materiais e andamento
                  da obra.
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 px-4 py-5">
            <p className="mb-3 px-3 text-[11px] uppercase tracking-[0.24em] text-white/35">
              Menu
            </p>

            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center justify-between rounded-2xl border border-transparent px-3 py-3 text-sm text-white/70 transition hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.04] text-white/70 transition group-hover:bg-orange-500/15 group-hover:text-orange-400">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="truncate font-medium">{item.label}</span>
                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 text-white/20 transition group-hover:text-white/45" />
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-white/8 p-4">
            <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur-md">
              <p className="text-sm font-semibold text-white">Tiago Oliveira</p>
              <p className="mt-1 text-xs text-white/45">
                Administrador da plataforma
              </p>

              <DashboardLogoutButton />
            </div>
          </div>
        </aside>

        {/* Conteúdo */}
        <div className="flex min-h-dvh min-w-0 flex-1 flex-col overflow-x-hidden">
          {/* Topbar */}
          <header className="sticky top-0 z-30 border-b border-white/8 bg-[#0b0b0c]/90 backdrop-blur-xl">
            <div className="flex min-h-[68px] w-full min-w-0 items-center justify-between gap-3 px-4 py-3 sm:min-h-[76px] sm:px-6 lg:px-8">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.22em] text-orange-400 sm:text-[11px] sm:tracking-[0.24em]">
                  Painel
                </p>
                <h1 className="mt-1 truncate text-lg font-bold text-white sm:text-xl lg:text-2xl">
                  Dashboard da Obra
                </h1>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/55 md:block">
                  Segunda-feira, 30 Mar
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-sm font-bold text-white shadow-[0_12px_28px_rgba(255,98,0,0.35)] sm:h-11 sm:w-11">
                  TO
                </div>
              </div>
            </div>
          </header>

          {/* Bloco de marca mobile */}
          <div className="border-b border-white/8 px-4 py-4 lg:hidden">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative shrink-0">
                <div className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 blur-lg" />
                <img
                  src="/logomorais.svg"
                  alt="Morais Construtora"
                  className="relative h-9 w-auto"
                />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-base font-black leading-none text-white">
                  Brick Morais
                </h2>
                <p className="mt-1 text-xs text-white/60">Gestão de obras</p>
              </div>
            </div>
          </div>

          {/* Menu mobile */}
          <div className="border-b border-white/8 px-4 py-3 lg:hidden">
            <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max gap-2 pb-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white/70 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-300"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <main className="flex-1 min-w-0 overflow-x-hidden px-2.5 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-8">
            {children}
          </main>

          {/* Ações mobile */}
          <div className="border-t border-white/8 p-4 lg:hidden">
            <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur-md">
              <p className="text-sm font-semibold text-white">Tiago Oliveira</p>
              <p className="mt-1 text-xs text-white/45">
                Administrador da plataforma
              </p>

              <DashboardLogoutButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}