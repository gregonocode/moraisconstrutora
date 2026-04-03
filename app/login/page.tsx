"use client";

import { useMemo, useState } from "react";
import { HardHat, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";

export default function LoginObraPage() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nextPath = useMemo(() => {
    const next = searchParams.get("next");
    if (next && next.startsWith("/")) return next;
    return "/dashboard";
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }

    window.location.assign(nextPath);
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden border-r border-white/5 bg-[#080808] lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,80,23,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.04),transparent_28%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.025),transparent_25%,transparent_75%,rgba(255,255,255,0.02))]" />

          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
              Plataforma
            </p>

            <div className="mt-3 flex items-center gap-4">
              <div className="relative">
                <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-lg" />
                <img
                  src="/logomorais.svg"
                  alt="Morais Construtora"
                  className="relative h-14 w-auto"
                />
              </div>

              <div>
                <h1 className="text-2xl font-extrabold leading-none text-white">
                  Morais Control
                </h1>
                <p className="mt-1 text-sm text-white/60">Gestão de obras</p>
              </div>
            </div>

            <div className="mt-20 max-w-xl">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-[#FF8A63]">
                Gestão de Obras
              </p>

              <h2 className="mt-5 text-4xl font-bold leading-tight text-white xl:text-5xl">
                Controle sua obra com mais organização, clareza e resultado.
              </h2>

              <p className="mt-6 max-w-lg text-base leading-7 text-white/62">
                Acompanhe custos, equipes, etapas, materiais e andamento da obra
                em um só lugar. Uma plataforma moderna para construtoras,
                engenheiros e gestores.
              </p>
            </div>
          </div>

          <div className="relative z-10 grid gap-4">
            <div className="relative overflow-hidden rounded-[28px] border border-white/5 bg-[#252525] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.10),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_70%)]" />

              <div className="relative z-10 flex items-start gap-4">
                <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#080808] shadow-[0_10px_24px_rgba(255,255,255,0.10)]">
                  <HardHat className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    Acompanhamento em tempo real
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-white/60">
                    Visualize status da obra, produtividade da equipe e evolução
                    de cada etapa.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-white/5 bg-[#252525] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_70%)]" />

              <div className="relative z-10 flex items-start gap-4">
                <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#080808] shadow-[0_10px_24px_rgba(255,255,255,0.10)]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    Dados centralizados e seguros
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-white/60">
                    Gerencie informações importantes da operação com segurança e
                    praticidade.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center bg-[#080808] p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.10),transparent_28%)]" />

          <div className="relative z-10 w-full max-w-md">
            <div className="relative overflow-hidden rounded-[32px] border border-white/5 bg-[#252525] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)] sm:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.12),transparent_38%),linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_32%,transparent_75%,rgba(255,255,255,0.015))]" />

              <div className="relative z-10 mb-8 lg:hidden">
                <div className="mb-5 flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 blur-lg" />
                    <img
                      src="/logomorais.svg"
                      alt="Morais Construtora"
                      className="relative h-10 w-auto"
                    />
                  </div>

                  <div>
                    <h1 className="text-lg font-extrabold leading-none text-white">
                      Morais Control
                    </h1>
                    <p className="mt-1 text-xs text-white/60">Gestão de obras</p>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white">
                  Acessar plataforma
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Entre para gerenciar suas obras com mais controle e eficiência.
                </p>
              </div>

              <div className="relative z-10 mb-8 hidden lg:block">
                <h1 className="text-3xl font-bold text-white">Entrar</h1>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Acesse sua conta para continuar.
                </p>
              </div>

              <form className="relative z-10 space-y-5" onSubmit={handleLogin}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/82">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="seuemail@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-13 w-full rounded-2xl border border-white/8 bg-[#161616] px-4 text-white placeholder:text-white/25 outline-none transition focus:border-[#FF5017]/60 focus:ring-2 focus:ring-[#FF5017]/20"
                    required
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-medium text-white/82">
                      Senha
                    </label>
                    <button
                      type="button"
                      className="text-sm font-medium text-[#FF8A63] transition hover:text-[#FFB197]"
                    >
                      Esqueci minha senha
                    </button>
                  </div>

                  <input
                    type="password"
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="h-13 w-full rounded-2xl border border-white/8 bg-[#161616] px-4 text-white placeholder:text-white/25 outline-none transition focus:border-[#FF5017]/60 focus:ring-2 focus:ring-[#FF5017]/20"
                    required
                  />
                </div>

                {error ? (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="h-13 w-full rounded-2xl bg-[#FF5017] font-semibold text-white shadow-[0_12px_30px_rgba(255,80,23,0.32)] transition hover:scale-[1.01] hover:bg-[#ff612e] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Entrando..." : "Entrar na plataforma"}
                </button>
              </form>

              <div className="relative z-10 mt-6 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-center text-sm text-white/45">
                Acesso restrito para administradores e equipe autorizada.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}