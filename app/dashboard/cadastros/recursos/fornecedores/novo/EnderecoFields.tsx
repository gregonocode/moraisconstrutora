'use client';

import { useState } from 'react';
import { Building2, MapPin } from 'lucide-react';

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function formatCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-white/70">{children}</label>
  );
}

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  icon,
  className = '',
  value,
  onChange,
  onBlur,
  disabled = false,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  disabled?: boolean;
  maxLength?: number;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>

      <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3">
        {icon ? <span className="text-white/35">{icon}</span> : null}
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          maxLength={maxLength}
          className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none disabled:cursor-not-allowed disabled:opacity-70"
        />
      </div>
    </div>
  );
}

export default function EnderecoFields() {
  const [loadingCep, setLoadingCep] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

  async function buscarCep() {
    const cepLimpo = onlyDigits(form.cep);

    if (cepLimpo.length !== 8) {
      setMsg('Digite um CEP válido com 8 números.');
      return;
    }

    try {
      setLoadingCep(true);
      setMsg(null);

      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Falha ao consultar o CEP.');
      }

      const data = await response.json();

      if (data?.erro) {
        setMsg('CEP não encontrado. Preencha o endereço manualmente.');
        return;
      }

      setForm((prev) => ({
        ...prev,
        cep: formatCep(cepLimpo),
        endereco: String(data.logradouro ?? ''),
        complemento: prev.complemento || String(data.complemento ?? ''),
        bairro: String(data.bairro ?? ''),
        cidade: String(data.localidade ?? ''),
        estado: String(data.uf ?? ''),
      }));
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setMsg('Não foi possível buscar o CEP agora. Preencha manualmente.');
    } finally {
      setLoadingCep(false);
    }
  }

  return (
    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="space-y-2">
        <Label>CEP</Label>

        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3">
            <span className="text-white/35">
              <MapPin className="h-4 w-4" />
            </span>

            <input
              name="cep"
              placeholder="00000-000"
              inputMode="numeric"
              value={form.cep}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  cep: formatCep(e.target.value),
                }))
              }
              onBlur={() => {
                if (onlyDigits(form.cep).length === 8) {
                  buscarCep();
                }
              }}
              className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
            />
          </div>

          <button
            type="button"
            onClick={buscarCep}
            disabled={loadingCep}
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.10] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingCep ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </div>

      <Field
        label="Endereço"
        name="endereco"
        placeholder="Rua, avenida..."
        icon={<MapPin className="h-4 w-4" />}
        className="xl:col-span-2"
        value={form.endereco}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            endereco: e.target.value,
          }))
        }
      />

      <Field
        label="Número"
        name="numero"
        placeholder="123"
        icon={<Building2 className="h-4 w-4" />}
        value={form.numero}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            numero: e.target.value,
          }))
        }
      />

      <Field
        label="Complemento"
        name="complemento"
        placeholder="Sala, bloco..."
        icon={<Building2 className="h-4 w-4" />}
        value={form.complemento}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            complemento: e.target.value,
          }))
        }
      />

      <Field
        label="Bairro"
        name="bairro"
        placeholder="Centro"
        icon={<MapPin className="h-4 w-4" />}
        value={form.bairro}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            bairro: e.target.value,
          }))
        }
      />

      <Field
        label="Cidade"
        name="cidade"
        placeholder="Santarém"
        icon={<MapPin className="h-4 w-4" />}
        value={form.cidade}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            cidade: e.target.value,
          }))
        }
      />

      <Field
        label="Estado"
        name="estado"
        placeholder="PA"
        icon={<MapPin className="h-4 w-4" />}
        value={form.estado}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            estado: e.target.value.toUpperCase().slice(0, 2),
          }))
        }
        maxLength={2}
      />

      {msg ? (
        <div className="md:col-span-2 xl:col-span-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/80">
            {msg}
          </div>
        </div>
      ) : null}
    </div>
  );
}