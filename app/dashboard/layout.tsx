"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Blocks,
  Package,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  Receipt,
  HardHat,
  LayoutDashboard,
  UserCog,
  UserRound,
  Users,
  Wrench,
  Settings,
  LogOut,
} from "lucide-react";
import { DashboardLogoutButton } from "@/app/components/DashboardLogoutButton";

type DashboardLayoutProps = {
  children: ReactNode;
};

const mainMenu = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
];

const obrasMenu = [
  {
    label: "Visão geral",
    href: "/dashboard/obras",
    icon: HardHat,
  },
  {
    label: "Equipe",
    href: "/dashboard/obras/equipe",
    icon: Users,
  },
];

const orcamentosMenu = [
  {
    label: "Visão geral",
    href: "/dashboard/orcamentos",
    icon: Receipt,
  },
  {
    label: "Composições",
    href: "/dashboard/orcamentos/composicoes",
    icon: Blocks,
  },
];

const recursosMenu = [
  {
    label: "Clientes",
    href: "/dashboard/cadastros/recursos/clientes",
    icon: UserRound,
  },
  {
    label: "Materiais",
    href: "/dashboard/cadastros/recursos/materiais",
    icon: Package,
  },
  {
    label: "Mão de obra",
    href: "/dashboard/cadastros/recursos/mao-de-obra",
    icon: Users,
  },
  {
    label: "Cargo / Função",
    href: "/dashboard/cadastros/recursos/cargos",
    icon: UserCog,
  },
  {
    label: "Fornecedores",
    href: "/dashboard/cadastros/recursos/fornecedores",
    icon: BriefcaseBusiness,
  },
  {
    label: "Equipamentos",
    href: "/dashboard/cadastros/recursos/equipamentos",
    icon: Wrench,
  },
  {
    label: "Serviços",
    href: "/dashboard/cadastros/recursos/servicos",
    icon: Blocks,
  },
];

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isObrasRoute = pathname.startsWith("/dashboard/obras");
  const isOrcamentosRoute = pathname.startsWith("/dashboard/orcamentos");
  const isCadastrosRoute = pathname.startsWith("/dashboard/cadastros");
  const isRecursosRoute = pathname.startsWith("/dashboard/cadastros/recursos");

  const [obrasOpen, setObrasOpen] = useState(isObrasRoute);
  const [orcamentosOpen, setOrcamentosOpen] = useState(isOrcamentosRoute);
  const [cadastrosOpen, setCadastrosOpen] = useState(isCadastrosRoute);
  const [recursosOpen, setRecursosOpen] = useState(isRecursosRoute);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const obrasActive = obrasMenu.some((item) => isActive(item.href));
  const recursosActive = recursosMenu.some((item) => isActive(item.href));

  const currentDate = useMemo(() => {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "short",
    }).format(new Date());
  }, []);

  const formattedDate =
    currentDate.charAt(0).toUpperCase() + currentDate.slice(1);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#0b0b0c] text-white">
      <div className="flex min-h-dvh w-full overflow-x-hidden">
        {/* Sidebar desktop */}
        <aside className="hidden w-[310px] shrink-0 border-r border-white/8 bg-[#0f0f10] lg:flex lg:flex-col">
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
                      Morais Control
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

          <div className="flex-1 overflow-y-auto px-4 py-5">
            <p className="mb-3 px-3 text-[11px] uppercase tracking-[0.24em] text-white/35">
              Menu
            </p>

            <nav className="space-y-2">
              {mainMenu.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center justify-between rounded-2xl border px-3 py-3 text-sm transition ${
                      active
                        ? "border-[#FF5017]/30 bg-[#FF5017]/10 text-white"
                        : "border-transparent text-white/70 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition ${
                          active
                            ? "bg-[#FF5017] text-white"
                            : "bg-white/[0.04] text-white/70 group-hover:bg-orange-500/15 group-hover:text-orange-400"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="truncate font-medium">{item.label}</span>
                    </div>

                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition ${
                        active
                          ? "text-white/70"
                          : "text-white/20 group-hover:text-white/45"
                      }`}
                    />
                  </Link>
                );
              })}

              {/* Obras retrátil */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setObrasOpen((prev) => !prev)}
                  className={`group flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-sm transition ${
                    obrasActive
                      ? "border-[#FF5017]/20 bg-[#FF5017]/8 text-white"
                      : "border-transparent text-white/70 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition ${
                        obrasActive
                          ? "bg-[#FF5017] text-white"
                          : "bg-white/[0.04] text-white/70 group-hover:bg-orange-500/15 group-hover:text-orange-400"
                      }`}
                    >
                      <HardHat className="h-5 w-5" />
                    </div>
                    <span className="truncate font-medium">Obras</span>
                  </div>

                  {obrasOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-white/55" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-white/35" />
                  )}
                </button>

                {obrasOpen && (
                  <div className="ml-4 space-y-1 border-l border-white/6 pl-3">
                    {obrasMenu.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                            active
                              ? "bg-[#FF5017]/12 text-white"
                              : "text-white/65 hover:bg-white/[0.04] hover:text-white"
                          }`}
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                              active
                                ? "bg-[#FF5017] text-white"
                                : "bg-white/[0.04] text-white/60 group-hover:text-orange-300"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Orçamentos retrátil */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setOrcamentosOpen((prev) => !prev)}
                  className={`group flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-sm transition ${
                    isOrcamentosRoute
                      ? "border-[#FF5017]/20 bg-[#FF5017]/8 text-white"
                      : "border-transparent text-white/70 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition ${
                        isOrcamentosRoute
                          ? "bg-[#FF5017] text-white"
                          : "bg-white/[0.04] text-white/70 group-hover:bg-orange-500/15 group-hover:text-orange-400"
                      }`}
                    >
                      <Receipt className="h-5 w-5" />
                    </div>
                    <span className="truncate font-medium">Orçamentos</span>
                  </div>

                  {orcamentosOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-white/55" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-white/35" />
                  )}
                </button>

                {orcamentosOpen && (
                  <div className="ml-4 space-y-1 border-l border-white/6 pl-3">
                    {orcamentosMenu.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                            active
                              ? "bg-[#FF5017]/12 text-white"
                              : "text-white/65 hover:bg-white/[0.04] hover:text-white"
                          }`}
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                              active
                                ? "bg-[#FF5017] text-white"
                                : "bg-white/[0.04] text-white/60 group-hover:text-orange-300"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cadastros retrátil */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setCadastrosOpen((prev) => !prev)}
                  className={`group flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-sm transition ${
                    isCadastrosRoute
                      ? "border-[#FF5017]/20 bg-[#FF5017]/8 text-white"
                      : "border-transparent text-white/70 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition ${
                        isCadastrosRoute
                          ? "bg-[#FF5017] text-white"
                          : "bg-white/[0.04] text-white/70 group-hover:bg-orange-500/15 group-hover:text-orange-400"
                      }`}
                    >
                      <Blocks className="h-5 w-5" />
                    </div>
                    <span className="truncate font-medium">Cadastros</span>
                  </div>

                  {cadastrosOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-white/55" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-white/35" />
                  )}
                </button>

                {cadastrosOpen && (
                  <div className="ml-4 space-y-2 border-l border-white/6 pl-3">
                    {/* Recursos retrátil */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setRecursosOpen((prev) => !prev)}
                        className={`group flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-sm transition ${
                          recursosActive
                            ? "border-[#FF5017]/20 bg-[#FF5017]/8 text-white"
                            : "border-transparent text-white/65 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                              recursosActive
                                ? "bg-[#FF5017] text-white"
                                : "bg-white/[0.04] text-white/60 group-hover:text-orange-300"
                            }`}
                          >
                            <Package className="h-4 w-4" />
                          </div>
                          <span className="truncate">Recursos</span>
                        </div>

                        {recursosOpen ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-white/55" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-white/35" />
                        )}
                      </button>

                      {recursosOpen && (
                        <div className="ml-4 space-y-1 border-l border-white/6 pl-3">
                          {recursosMenu.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);

                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                                  active
                                    ? "bg-[#FF5017]/12 text-white"
                                    : "text-white/65 hover:bg-white/[0.04] hover:text-white"
                                }`}
                              >
                                <div
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                                    active
                                      ? "bg-[#FF5017] text-white"
                                      : "bg-white/[0.04] text-white/60 group-hover:text-orange-300"
                                  }`}
                                >
                                  <Icon className="h-4 w-4" />
                                </div>

                                <span className="truncate">{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </aside>

        {/* Conteúdo */}
        <div className="flex min-h-dvh min-w-0 flex-1 flex-col overflow-x-hidden">
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
                  {formattedDate}
                </div>

                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-[0_12px_28px_rgba(255,98,0,0.35)] transition hover:scale-[1.02] sm:h-11 sm:w-11"
                    aria-label="Abrir menu da conta"
                  >
                    <Settings className="h-5 w-5" />
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-72 overflow-hidden rounded-3xl border border-white/10 bg-[#121214] p-2 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        
                        <p className="mt-1 text-xs text-white/45">
                          Administrador da plataforma
                        </p>
                      </div>

                      <div className="mt-2">
                        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-2">
                          <div className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-white/80">
                            
                            <div className="flex-1">
                              <DashboardLogoutButton />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

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
                  Morais Control
                </h2>
                <p className="mt-1 text-xs text-white/60">Gestão de obras</p>
              </div>
            </div>
          </div>

          <main className="min-w-0 flex-1 overflow-x-hidden px-2.5 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}