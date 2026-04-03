"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/app/lib/supabase/client";

export function DashboardLogoutButton() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleLogout() {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      window.location.assign("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-medium text-white/75 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-300 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <LogOut className="h-4 w-4" />
      {loading ? "Saindo..." : "Sair da conta"}
    </button>
  );
}