
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Movement = {
  id: string;
  description: string;
  category: string;
  type: "Ingreso" | "Gasto";
  amount: number;
  date: string;
};

const currency = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export default function Home() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Ventas");
  const [type, setType] = useState<"Ingreso" | "Gasto">("Ingreso");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [savingMovement, setSavingMovement] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  
  useEffect(() => {
    let active = true;

    async function loadMovements(userId: string) {
      setLoadingMovements(true);

      const { data, error } = await supabase
        .from("movements")
        .select("id, description, category, type, amount, movement_date")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        setNotice(`No se pudieron cargar los movimientos: ${error.message}`);
        setLoadingMovements(false);
        return;
      }

      setMovements(
        (data ?? []).map((item) => ({
          id: String(item.id),
          description: item.description,
          category: item.category,
          type: item.type as "Ingreso" | "Gasto",
          amount: Number(item.amount),
          date: item.movement_date,
        }))
      );
      setLoadingMovements(false);
    }

    async function checkSession() {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error || !session) {
        window.location.replace("/login");
        return;
      }

      setCheckingSession(false);
      await loadMovements(session.user.id);
    }

    void checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          window.location.replace("/login");
        } else if (active) {
          setCheckingSession(false);
          void loadMovements(session.user.id);
        }
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
  const today = new Date();
  const localDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  setDate(localDate);
}, []);

  if (checkingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="text-lg">Verificando tu sesión...</p>
      </main>
    );
  }

  const income = movements
    .filter((item) => item.type === "Ingreso")
    .reduce((sum, item) => sum + item.amount, 0);

  const expenses = movements
    .filter((item) => item.type === "Gasto")
    .reduce((sum, item) => sum + item.amount, 0);

  const result = income - expenses;
  const margin = income > 0 ? (result / income) * 100 : 0;

  async function addMovement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (!description.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0 || !date) {
      setNotice("Completa todos los campos con datos válidos.");
      return;
    }

    setSavingMovement(true);
    setNotice("");

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setNotice("Tu sesión no está disponible. Vuelve a iniciar sesión.");
      setSavingMovement(false);
      window.location.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("movements")
      .insert({
        user_id: user.id,
        description: description.trim(),
        category,
        type,
        amount: numericAmount,
        movement_date: date,
      })
      .select("id, description, category, type, amount, movement_date")
      .single();

    if (error) {
      setNotice(`No se pudo guardar el movimiento: ${error.message}`);
      setSavingMovement(false);
      return;
    }

    const savedMovement: Movement = {
      id: String(data.id),
      description: data.description,
      category: data.category,
      type: data.type as "Ingreso" | "Gasto",
      amount: Number(data.amount),
      date: data.movement_date,
    };

    setMovements((previous) => [savedMovement, ...previous]);
    setDescription("");
    setAmount("");
    setDate(new Date().toLocaleDateString("en-CA"));
    setNotice("Movimiento guardado correctamente en tu cuenta.");
    setShowForm(false);
    setSavingMovement(false);
  }
    async function updateMovement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (
      !editingId ||
      !description.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      !date
    ) {
      setNotice("Completa todos los campos con datos válidos.");
      return;
    }

    setSavingMovement(true);
    setNotice("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setNotice("Tu sesión no está disponible. Vuelve a iniciar sesión.");
      setSavingMovement(false);
      window.location.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("movements")
      .update({
        description: description.trim(),
        category,
        type,
        amount: numericAmount,
        movement_date: date,
      })
      .eq("id", editingId)
      .eq("user_id", user.id)
      .select("id, description, category, type, amount, movement_date")
      .single();

    if (error) {
      setNotice(`No se pudo actualizar el movimiento: ${error.message}`);
      setSavingMovement(false);
      return;
    }

    const updatedMovement: Movement = {
      id: String(data.id),
      description: data.description,
      category: data.category,
      type: data.type as "Ingreso" | "Gasto",
      amount: Number(data.amount),
      date: data.movement_date,
    };

    setMovements((previous) =>
      previous.map((item) =>
        item.id === editingId ? updatedMovement : item
      )
    );

    setEditingId(null);
    setDescription("");
    setCategory("Ventas");
    setType("Ingreso");
    setAmount("");
    setNotice("Movimiento actualizado correctamente.");
    setShowForm(false);
    setSavingMovement(false);
  }
    function startEditing(movement: Movement) {
    setEditingId(movement.id);
    setDescription(movement.description);
    setCategory(movement.category);
    setType(movement.type);
    setAmount(String(movement.amount));
    setDate(movement.date);
    setShowForm(true);
    setNotice("");
  }

  async function deleteMovement() {
    if (!editingId) return;

    const confirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar este movimiento? Esta acción no se puede deshacer."
    );

    if (!confirmed) return;

    setSavingMovement(true);
    setNotice("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setNotice("Tu sesión no está disponible. Vuelve a iniciar sesión.");
      setSavingMovement(false);
      window.location.replace("/login");
      return;
    }

    const { error } = await supabase
      .from("movements")
      .delete()
      .eq("id", editingId)
      .eq("user_id", user.id);

    if (error) {
      setNotice(`No se pudo eliminar el movimiento: ${error.message}`);
      setSavingMovement(false);
      return;
    }

    setMovements((previous) =>
      previous.filter((item) => item.id !== editingId)
    );

    setEditingId(null);
    setDescription("");
    setCategory("Ventas");
    setType("Ingreso");
    setAmount("");
    setShowForm(false);
    setNotice("Movimiento eliminado correctamente.");
    setSavingMovement(false);
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

<div className="mt-auto">
  <div className="rounded-xl bg-slate-900 p-4">
    <p className="font-medium">Versión inicial</p>
    <p className="mt-1 text-sm text-slate-400">
      Datos guardados en Supabase
    </p>
  </div>

  <button
    type="button"
    onClick={async () => {
      const { error } = await supabase.auth.signOut();

      if (error) {
        alert("No se pudo cerrar la sesión: " + error.message);
        return;
      }

      window.location.replace("/login");
    }}
    className="mt-4 w-full rounded-xl border border-red-500/30 px-4 py-3 text-left font-medium text-red-400 transition hover:bg-red-500/10"
  >
    ↪ Cerrar sesión
  </button>
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
  onSubmit={editingId ? updateMovement : addMovement}
            className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="mb-5 text-xl font-bold">
  {editingId ? "Editar movimiento" : "Nuevo movimiento"}
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
                disabled={savingMovement}
                className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
              >
                {savingMovement
  ? "Guardando..."
  : editingId
    ? "Guardar cambios"
    : "Guardar movimiento"}
              </button>
              {editingId && (
  <button
    type="button"
    onClick={deleteMovement}
    disabled={savingMovement}
    className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
  >
    {savingMovement ? "Procesando..." : "Eliminar movimiento"}
  </button>
)}
              <button
                type="button"
                onClick={() => {
  setShowForm(false);
  setEditingId(null);
  setDescription("");
  setCategory("Ventas");
  setType("Ingreso");
  setAmount("");
  setNotice("");
}}

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
              Total de ingresos registrados
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Gastos registrados</p>
            <p className="mt-3 text-2xl font-bold text-rose-600">
              {currency.format(expenses)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Total de gastos registrados
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
                Movimientos guardados en tu cuenta.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
              {loadingMovements ? "Cargando..." : `${movements.length} movimientos`}
            </span>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Descripción</th>
                  <th className="pb-3 pr-4 font-medium">Categoría</th>
                  <th className="pb-3 pr-4 font-medium">Fecha</th>
                  <th className="pb-3 pr-4 font-medium">Tipo</th>
                  <th className="pb-3 text-right font-medium">Importe</th>
                  <th className="pb-3 pl-4 text-center font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingMovements ? (
                  <tr><td colSpan={6} className="py-6 text-center text-slate-500">Cargando movimientos...</td></tr>
                ) : movements.length === 0 ? (
                  <tr><td colSpan={6} className="py-6 text-center text-slate-500">Todavía no tienes movimientos registrados.</td></tr>
                ) : movements.map((item) => (
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
                    <td className="py-4 pl-4 text-center">
  <button
    type="button"
    onClick={() => startEditing(item)}
    className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
  >
    Editar
  </button>
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
          Finanza · En desarrollo
        </footer>
      </section>
    </main>
  );
}
