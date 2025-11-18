"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, preference } from "@/utils/api";

type ModelField = {
  type: "closed" | "location" | "schedule" | string;
  expected: string[];
};

export default function Preferencias() {
  const router = useRouter();
  const [model, setModel] = useState<Record<string, ModelField> | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);

  // form state is dynamic: record fieldName -> value depending on type
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Keep existing behavior for which closed fields are multi-select (checkboxes)
  // This preserves the UX from your original component for fields like "Estilo de Convivência" and "Hobbies".
  const multiSelectFields = new Set(["Estilo de Convivência", "Hobbies"]);

  useEffect(() => {
    const loadModel = async () => {
      setLoadingModel(true);
      try {
        const res = await fetch("/preferences/model");
        if (!res.ok) throw new Error("Falha ao carregar modelo de preferências");
        const json = await res.json();
        setModel(json);

        // initialize default form values based on type
        const defaults: Record<string, any> = {};
        Object.entries(json).forEach(([k, v]: [any, any]) => {
          if (v.type === "closed") {
            if (multiSelectFields.has(k)) defaults[k] = [];
            else defaults[k] = "";
          } else if (v.type === "location") {
            defaults[k] = ""; // will be number on submit
          } else if (v.type === "schedule") {
            defaults[k] = { days: [], start: "", end: "" };
          } else {
            defaults[k] = "";
          }
        });
        setFormValues(defaults);
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar modelo");
      } finally {
        setLoadingModel(false);
      }
    };
    loadModel();
  }, []);

  const toggleMulti = (field: string, value: string) => {
    setFormValues((prev) => {
      const arr = Array.isArray(prev[field]) ? [...prev[field]] : [];
      const idx = arr.indexOf(value);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(value);
      return { ...prev, [field]: arr };
    });
  };

  const toggleScheduleDay = (field: string, dayKey: string) => {
    setFormValues((prev) => {
      const schedule = prev[field] || { days: [], start: "", end: "" };
      const days = Array.isArray(schedule.days) ? [...schedule.days] : [];
      const idx = days.indexOf(dayKey);
      if (idx >= 0) days.splice(idx, 1);
      else days.push(dayKey);
      return { ...prev, [field]: { ...schedule, days } };
    });
  };

  const setScheduleTime = (field: string, key: "start" | "end", value: string) => {
    setFormValues((prev) => {
      const schedule = prev[field] || { days: [], start: "", end: "" };
      return { ...prev, [field]: { ...schedule, [key]: value } };
    });
  };

  const validate = (): boolean => {
    if (!model) return false;
    for (const [name, def] of Object.entries(model)) {
      const val = formValues[name];
      if (def.type === "closed") {
        if (multiSelectFields.has(name)) {
          if (!Array.isArray(val) || val.length === 0) {
            setError(`Preencha o campo: ${name}`);
            return false;
          }
        } else {
          if (!val) {
            setError(`Preencha o campo: ${name}`);
            return false;
          }
        }
      }
      if (def.type === "location") {
        if (val === "" || val === null || val === undefined) {
          setError(`Preencha o campo: ${name}`);
          return false;
        }
      }
      if (def.type === "schedule") {
        if (!val || !Array.isArray(val.days) || val.days.length === 0 || !val.start || !val.end) {
          setError(`Preencha o campo: ${name}`);
          return false;
        }
      }
    }
    setError(null);
    return true;
  };

  const formatScheduleTime = (time: string) => {
    // time is like "22:00" or "08:30". Convert to "22h" or "08h30".
    if (!time) return "";
    const [hh, mm] = time.split(":");
    if (!mm || mm === "00") return `${parseInt(hh, 10)}h`;
    return `${parseInt(hh, 10)}h${mm}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!model) return;
    setSubmitting(true);
    setError(null);
    try {
      const preferences: Array<{ name: string; value: string | number; weight: number }> = [];

      for (const [name, def] of Object.entries(model)) {
        const val = formValues[name];
        if (def.type === "closed") {
          if (multiSelectFields.has(name)) {
            // send as comma separated list (keeps same behaviour as original component)
            preferences.push({ name, value: Array.isArray(val) ? val.join(", ") : "", weight: 1 });
          } else {
            preferences.push({ name, value: String(val), weight: 1 });
          }
        } else if (def.type === "location") {
          preferences.push({ name, value: Number(val), weight: 1 });
        } else if (def.type === "schedule") {
          // val: { days: string[], start: string, end: string }
          const formatted = (val.days || []).map(() => `${formatScheduleTime(val.start)}-${formatScheduleTime(val.end)}`).join("; ");
          // IMPORTANT: the backend expects a list of intervals separated by ";" where each interval corresponds to a day selected
          preferences.push({ name, value: formatted, weight: 1 });
        } else {
          // fallback - send as string
          preferences.push({ name, value: String(val ?? ""), weight: 1 });
        }
      }

      await preference.create({ preferences });
      setSuccess("Preferências salvas com sucesso!");
      setTimeout(() => router.push("/conta"), 900);
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar preferências");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingModel) return <div>Carregando modelo de preferências...</div>;
  if (!model) return <div>Modelo de preferências não encontrado.</div>;

  // days UI labels (keeps same order and keys as original code)
  const days = [
    ["segunda", "Seg"],
    ["terca", "Ter"],
    ["quarta", "Qua"],
    ["quinta", "Qui"],
    ["sexta", "Sex"],
    ["sabado", "Sáb"],
    ["domingo", "Dom"],
  ];

  return (
    <div className="cadastro-page">
      <div className="cadastro-container">
        <div className="cadastro-header">
          <h2>CASAR</h2>
          <h3>Cadastro de Preferências</h3>
        </div>

        <form onSubmit={handleSubmit} className="cadastro-form">
          {Object.entries(model).map(([name, def]) => (
            <div key={name} className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">{name}</label>

              {def.type === "closed" && (
                <>
                  {multiSelectFields.has(name) ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 8 }}>
                      {def.expected.map((opt) => (
                        <label key={opt} style={{ fontWeight: 500 }}>
                          <input
                            type="checkbox"
                            value={opt}
                            checked={Array.isArray(formValues[name]) && formValues[name].includes(opt)}
                            onChange={() => toggleMulti(name, opt)}
                            style={{ marginRight: 8 }}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      value={formValues[name] ?? ""}
                      onChange={(e) => setFormValues((p) => ({ ...p, [name]: e.target.value }))}
                      required
                    >
                      <option value="" disabled>
                        Selecionar opção
                      </option>
                      {def.expected.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                </>
              )}

              {def.type === "location" && (
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  className="form-input"
                  value={formValues[name]}
                  onChange={(e) => setFormValues((p) => ({ ...p, [name]: e.target.value === "" ? "" : Number(e.target.value) }))}
                  placeholder="Raio máximo em km (ex: 5)"
                  required
                />
              )}

              {def.type === "schedule" && (
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {days.map((d) => (
                        <label key={d[0]} style={{ fontWeight: 500 }}>
                          <input
                            type="checkbox"
                            value={d[0]}
                            checked={Array.isArray(formValues[name]?.days) && formValues[name].days.includes(d[0])}
                            onChange={() => toggleScheduleDay(name, d[0])}
                            style={{ marginRight: 6 }}
                          />
                          {d[1]}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Início</label>
                      <input
                        type="time"
                        className="form-input"
                        value={formValues[name]?.start ?? ""}
                        onChange={(e) => setScheduleTime(name, "start", e.target.value)}
                        required
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Fim</label>
                      <input
                        type="time"
                        className="form-input"
                        value={formValues[name]?.end ?? ""}
                        onChange={(e) => setScheduleTime(name, "end", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* fallback for unknown types */}
              {def.type !== "closed" && def.type !== "location" && def.type !== "schedule" && (
                <input
                  type="text"
                  className="form-input"
                  value={formValues[name] ?? ""}
                  onChange={(e) => setFormValues((p) => ({ ...p, [name]: e.target.value }))}
                />
              )}
            </div>
          ))}

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions" style={{ display: "flex", gap: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar Preferências"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => router.push("/")}> 
              Voltar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
