"use client";

import { Building2, HardHat, ShieldCheck } from "lucide-react";

export default function LoginObraPage() {
  return (
    <main className="min-h-screen bg-[#181818] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Branding - aparece só no desktop */}
        <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#121212] p-10 xl:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(234,88,12,0.10),transparent_35%)]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-white/60">Plataforma</p>
                <h1 className="text-lg font-semibold tracking-wide">ObraControl</h1>
              </div>
            </div>

            <div className="mt-16 max-w-xl">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-orange-400">
                Gestão de Obras
              </p>

              <h2 className="mt-4 text-4xl font-bold leading-tight xl:text-5xl">
                Controle sua obra com mais organização, clareza e resultado.
              </h2>

              <p className="mt-6 max-w-lg text-base leading-7 text-white/70">
                Acompanhe custos, equipes, etapas, materiais e andamento da obra
                em um só lugar. Uma plataforma moderna para construtoras,
                engenheiros e gestores.
              </p>
            </div>
          </div>

          <div className="relative z-10 grid gap-4">
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                <HardHat className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Acompanhamento em tempo real</h3>
                <p className="mt-1 text-sm leading-6 text-white/65">
                  Visualize status da obra, produtividade da equipe e evolução de cada etapa.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Dados centralizados e seguros</h3>
                <p className="mt-1 text-sm leading-6 text-white/65">
                  Gerencie informações importantes da operação com segurança e praticidade.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Login */}
        <section className="flex items-center justify-center p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-md">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md sm:p-8">
              <div className="mb-8 lg:hidden">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
                  <Building2 className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold">Acessar plataforma</h1>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Entre para gerenciar suas obras com mais controle e eficiência.
                </p>
              </div>

              <div className="hidden lg:block mb-8">
                <h1 className="text-3xl font-bold">Entrar</h1>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Acesse sua conta para continuar.
                </p>
              </div>

              <form className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/85">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="seuemail@empresa.com"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-[#202020] px-4 text-white placeholder:text-white/30 outline-none transition focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-medium text-white/85">
                      Senha
                    </label>
                    <button
                      type="button"
                      className="text-sm text-orange-400 transition hover:text-orange-300"
                    >
                      Esqueci minha senha
                    </button>
                  </div>

                  <input
                    type="password"
                    placeholder="••••••••"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-[#202020] px-4 text-white placeholder:text-white/30 outline-none transition focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <button
                  type="submit"
                  className="h-12 w-full rounded-2xl bg-orange-500 font-semibold text-white transition hover:bg-orange-600"
                >
                  Entrar na plataforma
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-white/50">
                Acesso restrito para administradores e equipe autorizada.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}