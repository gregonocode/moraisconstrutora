import Link from "next/link";
import { Building2, HardHat, ArrowRight, ClipboardList } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#181818] text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.15),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_25%)]" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10">
          {/* Topo */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-white/50">Plataforma</p>
                <h1 className="text-lg font-semibold">ObraControl</h1>
              </div>
            </div>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Entrar
            </Link>
          </header>

          {/* Hero */}
          <div className="flex flex-1 items-center">
            <div className="grid w-full gap-10 py-16 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm text-orange-300">
                  <HardHat className="h-4 w-4" />
                  Solução para gestão de obras
                </div>

                <h2 className="mt-6 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
                  Controle sua obra com mais organização e menos complicação.
                </h2>

                <p className="mt-5 max-w-xl text-base leading-7 text-white/65">
                  Uma plataforma para acompanhar etapas, equipes, materiais,
                  custos e o andamento da obra em um só lugar.
                </p>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 font-semibold text-white transition hover:bg-orange-600"
                  >
                    Acessar login
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <a
                    href="#sobre"
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 font-semibold text-white transition hover:bg-white/10"
                  >
                    Conhecer plataforma
                  </a>
                </div>
              </div>

              {/* Card lateral */}
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
                    <ClipboardList className="h-7 w-7" />
                  </div>

                  <h3 className="text-2xl font-semibold">
                    Plataforma em preparação
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-white/65">
                    Esta é uma página provisória para apresentação da solução.
                    Em breve, novas funcionalidades e módulos estarão disponíveis.
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-[#202020] px-4 py-3 text-sm text-white/75">
                      Acompanhamento de obras
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#202020] px-4 py-3 text-sm text-white/75">
                      Gestão de materiais e equipes
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#202020] px-4 py-3 text-sm text-white/75">
                      Controle operacional centralizado
                    </div>
                  </div>

                  <Link
                    href="/login"
                    className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-orange-500 font-semibold text-white transition hover:bg-orange-600"
                  >
                    Ir para login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="sobre"
        className="border-t border-white/10 bg-[#151515] px-6 py-16"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm uppercase tracking-[0.2em] text-orange-400">
              Sobre a solução
            </p>
            <h3 className="mt-3 text-3xl font-bold">
              Uma base simples para começar bem
            </h3>
            <p className="mt-4 text-white/65">
              Essa landing page provisória serve como ponto de entrada da
              plataforma, direcionando usuários para o login e apresentando a
              proposta do sistema.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h4 className="text-lg font-semibold">Organização</h4>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Centralize informações importantes da obra em um ambiente claro e moderno.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h4 className="text-lg font-semibold">Produtividade</h4>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Facilite a rotina de acompanhamento e tomada de decisão no dia a dia.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h4 className="text-lg font-semibold">Escalabilidade</h4>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Estruture sua operação desde o início com uma interface preparada para crescer.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}