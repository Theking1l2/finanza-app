
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        setMessage(
          data.session
            ? "¡Cuenta creada correctamente!"
            : "Cuenta creada. Revisa tu correo para confirmar el registro."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        window.location.href = "/";
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Ocurrió un error."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07111F] flex items-center justify-center p-6 text-white">
      <section className="w-full max-w-md rounded-2xl border border-emerald-500/20 bg-[#111D30] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl font-bold text-emerald-400">
            Finanza
          </div>
          <h1 className="text-2xl font-semibold">
            {isRegister ? "Crea tu cuenta" : "Bienvenido de nuevo"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Tu negocio, bajo control.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="w-full rounded-lg border border-slate-700 bg-[#07111F] p-3 outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Contraseña
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-lg border border-slate-700 bg-[#07111F] p-3 outline-none focus:border-emerald-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-400 p-3 font-semibold text-[#07111F] transition hover:bg-emerald-300 disabled:opacity-50"
          >
            {loading
              ? "Procesando..."
              : isRegister
              ? "Crear cuenta"
              : "Iniciar sesión"}
          </button>
        </form>

        {message && (
          <p className="mt-5 rounded-lg bg-[#07111F] p-3 text-center text-sm text-emerald-300">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          {isRegister ? "¿Ya tienes una cuenta?" : "¿Aún no tienes cuenta?"}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setMessage("");
            }}
            className="ml-2 font-semibold text-emerald-400 hover:text-emerald-300"
          >
            {isRegister ? "Inicia sesión" : "Regístrate"}
          </button>
        </p>
      </section>
    </main>
  );
}
