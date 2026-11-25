
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Movement = {
  id: number;
  description: string;
  category: string;
  type: "Ingreso" | "Gasto";
  amount: number;
  date: string;
};

const initialMovements: Movement[] = [
  {
    id: 1,
    description: "Venta de productos",
    category: "Ventas",
    type: "Ingreso",
    amount: 3500,
    date: "2026-10-27",
  },
  {
    id: 2,
    description: "Pago de alquiler",
    category: "Local",
    type: "Gasto",
    amount: 900,
    date: "2026-10-26",
  },
  {
    id: 3,
    description: "Servicio a un cliente",
    category: "Servicios",
    type: "Ingreso",
    amount: 1800,
    date: "2026-10-25",
  },
  {
    id: 4,
    description: "Compra de materiales",
    category: "Materiales",
    type: "Gasto",
    amount: 450,
    date: "2026-10-24",
  },
];

const currency = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export default function Home() {
  const [checkingSession, setCheckingSession] = useState(true);

useEffect(() => {
  let active = true;

  async function checkSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!active) return;

    if (!session) {
      window.location.replace("/login");
      if (checkingSession) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <p className="text-lg">Verificando tu sesión...</p>
    </main>
  );
}
      return;
    }

    setCheckingSession(false);
  }

  checkSession();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      window.location.replace("/login");
    } else if (active) {
      setCheckingSession(false);
    }
  });

  return () => {
    active = false;
    subscription.unsubscribe();
  };
}, []);
  const [movements, setMovements] =
    useState<Movement[]>(initialMovements);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Ventas");
  const [type, setType] = useState<"Ingreso" | "Gasto">("Ingreso");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("2026-10-28");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");

  const income = movements
    .filter((item) => item.type === "Ingreso")
    .reduce((sum, item) => sum + item.amount, 0);

  const expenses = movements
    .filter((item) => item.type === "Gasto")
    .reduce((sum, item) => sum + item.amount, 0);

  const result = income - expenses;
  const margin = income > 0 ? (result / income) * 100 : 0;

  function addMovement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (!description.trim() || !Number.isFinite(numericAmount) ||
        numericAmount <= 0 || !date) {
      setNotice("Completa todos los campos con datos válidos.");
      return;
    }

    setMovements((previous) => [
      {
        id: Date.now(),
        description: description.trim(),
        category,
        type,
        amount: numericAmount,
        date,
      },
      ...previous,
    ]);

    setDescription("");
    setAmount("");
    setNotice("Movimiento registrado en esta sesión.");
    setShowForm(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-slate-950 p-6 text-white">
        <div className="mb-10">
          <p className="text-2xl font-bold tracking-tight">Finanza</p>
          <p className="mt-1 text-sm text-slate-400">
            Tu negocio, bajo control
          </p>
        </div>

        <nav className="space-y-2">
          <div className="rounded-xl bg-emerald-500/15 px-4 py-3 font-medium text-emerald-300">
            ▦ Resumen financiero
          </div>
          <div className="rounded-xl px-4 py-3 text-slate-300">
            ↔ Ingresos y gastos
          </div>
          <div className="rounded-xl px-4 py-3 text-slate-300">
            ◷ Reportes
          </div>
          <div className="rounded-xl px-4 py-3 text-slate-300">
            ▤ Impuestos
          </div>
        </nav>

        <div className="mt-auto rounded-xl bg-slate-900 p-4">
          <p className="font-medium">Versión inicial</p>
          <p className="mt-1 text-sm text-slate-400">
            Datos de demostración
          </p>
        </div>
      </aside>

      <section className="mx-auto max-w-7xl p-5 sm:p-8 md:ml-64">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">
              Panel de control / Perú
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Resumen financiero
            </h1>
            <p className="mt-2 text-slate-500">
              Conoce cómo está funcionando tu negocio.
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setNotice("");
            }}
            className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            + Registrar movimiento
          </button>
        </header>

        {notice && (
          <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            {notice}
          </p>
        )}

        {showForm && (
          <form
            onSubmit={addMovement}
            className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="mb-5 text-xl font-bold">
              Nuevo movimiento
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-medium">
                Descripción
                <input
                  required
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Ej. Venta del día"
                  className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-normal"
                />
              </label>

              <label className="text-sm font-medium">
                Tipo
                <select
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value as "Ingreso" | "Gasto")
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 font-normal"
                >
                  <option>Ingreso</option>
                  <option>Gasto</option>
                </select>
              </label>

              <label className="text-sm font-medium">
                Categoría
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 font-normal"
                >
                  <option>Ventas</option>
                  <option>Servicios</option>
                  <option>Alquiler</option>
                  <option>Materiales</option>
                  <option>Transporte</option>
                  <option>Otros</option>
                </select>
              </label>

              <label className="text-sm font-medium">
                Importe (S/)
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-normal"
                />
              </label>

              <label className="text-sm font-medium">
                Fecha
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-normal"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
              >
                Guardar movimiento
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-300 px-5 py-3 font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Ingresos registrados</p>
            <p className="mt-3 text-2xl font-bold text-emerald-700">
              {currency.format(income)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Total de ingresos de ejemplo
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Gastos registrados</p>
            <p className="mt-3 text-2xl font-bold text-rose-600">
              {currency.format(expenses)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Total de gastos de ejemplo
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Resultado provisional</p>
            <p className={`mt-3 text-2xl font-bold ${result >= 0 ? "text-slate-900" : "text-rose-600"}`}>
              {currency.format(result)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Ingresos menos gastos registrados
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Margen provisional</p>
            <p className="mt-3 text-2xl font-bold">
              {margin.toLocaleString("es-PE", {
                maximumFractionDigits: 1,
              })}%
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Resultado / ingresos
            </p>
          </article>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Movimientos recientes</h2>
              <p className="mt-1 text-sm text-slate-500">
                Ingresos y gastos registrados en esta sesión.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
              {movements.length} movimientos
            </span>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Descripción</th>
                  <th className="pb-3 pr-4 font-medium">Categoría</th>
                  <th className="pb-3 pr-4 font-medium">Fecha</th>
                  <th className="pb-3 pr-4 font-medium">Tipo</th>
                  <th className="pb-3 text-right font-medium">Importe</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-4 pr-4 font-medium">{item.description}</td>
                    <td className="py-4 pr-4 text-slate-500">{item.category}</td>
                    <td className="py-4 pr-4 text-slate-500">{item.date}</td>
                    <td className="py-4 pr-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.type === "Ingreso" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className={`py-4 text-right font-semibold ${item.type === "Ingreso" ? "text-emerald-700" : "text-rose-600"}`}>
                      {item.type === "Ingreso" ? "+" : "-"}
                      {currency.format(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold">Módulo tributario</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Próximamente: perfil tributario, estimaciones de impuestos y
            recordatorios según el régimen que corresponda. Los cálculos
            tributarios deberán validarse con las reglas oficiales vigentes
            de SUNAT antes de utilizarse para decisiones reales.
          </p>
        </section>

        <footer className="py-8 text-center text-xs text-slate-500">
          Finanza · Prototipo en desarrollo · Importes de demostración
        </footer>
      </section>
    </main>
  );
}
