"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { preference } from "@/utils/api";
import type { PreferenceEntry } from "@/types";

type ModelField = {
  type: "closed" | "location" | "schedule" | string;
  expected: string[];
};

type EditingPreferenceState = {
  value: any;
  weight: number;
};

const multiSelectFields = new Set(["Estilo de Convivência", "Hobbies"]);
const DEFAULT_WEIGHT = 5;

export default function Preferencias() {
  const router = useRouter();
  const [model, setModel] = useState<Record<string, ModelField> | null>(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const [loadingPreferences, setLoadingPreferences] = useState(true);

  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [preferences, setPreferences] = useState<PreferenceEntry[]>([]);
  const [editingPreferences, setEditingPreferences] = useState<Record<string, EditingPreferenceState>>({});

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [managingPreference, setManagingPreference] = useState<string | null>(null);

  const handleAuthRedirect = (err: any) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      router.push("/login");
      return true;
    }
    return false;
  };

  const buildCreationDefaults = (config: Record<string, ModelField>) => {
    const defaults: Record<string, any> = {};
    Object.entries(config).forEach(([key, field]) => {
      if (field.type === "closed") {
        defaults[key] = multiSelectFields.has(key) ? [] : "";
      } else if (field.type === "location") {
        defaults[key] = "";
      } else if (field.type === "schedule") {
        defaults[key] = { start: "", end: "", entries: [] as Array<{ start: string; end: string }> };
      } else {
        defaults[key] = "";
      }
    });
    return defaults;
  };

  const loadUserPreferences = async (config: Record<string, ModelField> | null = model) => {
    if (!config) return;
    setLoadingPreferences(true);
    try {
      const list = await preference.list();
      const editingState: Record<string, EditingPreferenceState> = {};

      list.forEach((pref: PreferenceEntry) => {
        editingState[pref.name] = {
          weight: pref.weight,
          value: parsePreferenceValue(pref.name, pref.value, config),
        };
      });

      setPreferences(list);
      setEditingPreferences(editingState);
    } catch (err: any) {
      if (handleAuthRedirect(err)) return;
      setError(err?.response?.data?.error || err?.message || "Erro ao carregar preferências salvas");
    } finally {
      setLoadingPreferences(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoadingModel(true);
      try {
        const config = await preference.getModel();
        setModel(config);
        setFormValues(buildCreationDefaults(config));
        await loadUserPreferences(config);
      } catch (err: any) {
        if (handleAuthRedirect(err)) return;
        setError(err?.response?.data?.error || err?.message || "Erro ao carregar preferências");
      } finally {
        setLoadingModel(false);
      }
    };
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parsePreferenceValue = (name: string, value: string, config: Record<string, ModelField>) => {
    const def = config[name];
    if (!def) return value;

    if (def.type === "closed" && multiSelectFields.has(name)) {
      return value.split(", ").map((item) => item.trim()).filter(Boolean);
    }

    if (def.type === "location") {
      const distance = Number(value);
      return Number.isNaN(distance) ? "" : distance;
    }

    return value;
  };

  const toggleMulti = (field: string, value: string) => {
    setFormValues((prev) => {
      const arr = Array.isArray(prev[field]) ? [...prev[field]] : [];
      const idx = arr.indexOf(value);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(value);
      return { ...prev, [field]: arr };
    });
  };

  const setScheduleField = (field: string, key: "start" | "end", value: string) => {
    setFormValues((prev) => {
      const schedule = prev[field] || { start: "", end: "", entries: [] };
      return { ...prev, [field]: { ...schedule, [key]: value } };
    });
  };

  const addScheduleEntry = (field: string) => {
    setFormValues((prev) => {
      const schedule = prev[field] || { start: "", end: "", entries: [] };
      const { start, end } = schedule;
      const entries = Array.isArray(schedule.entries) ? schedule.entries : [];

      if (!start || !end) {
        setError("Informe horário de início e fim antes de adicionar.");
        return prev;
      }

      setError(null);
      const newEntries = [...entries, { start, end }];

      return {
        ...prev,
        [field]: { start: "", end: "", entries: newEntries },
      };
    });
  };

  const removeScheduleEntry = (field: string, index: number) => {
    setFormValues((prev) => {
      const schedule = prev[field] || { start: "", end: "", entries: [] };
      const entries = Array.isArray(schedule.entries) ? [...schedule.entries] : [];
      entries.splice(index, 1);
      return { ...prev, [field]: { ...schedule, entries } };
    });
  };

  const isFieldFilled = (name: string, def: ModelField, value: any) => {
    if (def.type === "closed") {
      if (multiSelectFields.has(name)) {
        return Array.isArray(value) && value.length > 0;
      }
      return Boolean(value);
    }

    if (def.type === "location") {
      return value !== "" && value !== null && value !== undefined;
    }

    if (def.type === "schedule") {
      const entries = Array.isArray(value?.entries) ? value.entries : [];
      return entries.length > 0;
    }

    return value !== undefined && value !== null && String(value).trim() !== "";
  };

  const validateCreationForm = (): boolean => {
    if (!model) return false;

    const filled = Object.entries(model).filter(([name, def]) =>
      isFieldFilled(name, def, formValues[name])
    );

    if (filled.length === 0) {
      setError("Selecione ao menos uma nova preferência para cadastrar.");
      return false;
    }

    if (preferences.length + filled.length < 3) {
      setError("É necessário manter ao menos 3 preferências ao todo.");
      return false;
    }

    setError(null);
    return true;
  };

  const formatScheduleTime = (time: string) => {
    if (!time) return "";
    const [hh = "00", mm = "00"] = time.split(":");
    const normalizedHour = hh.padStart(2, "0");
    if (!mm || mm === "00") {
      return `${normalizedHour}h`;
    }
    return `${normalizedHour}h${mm}`;
  };

  const serializeValue = (name: string, rawValue: any): string => {
    if (!model) return String(rawValue ?? "");
    const def = model[name];
    if (!def) return String(rawValue ?? "");

    if (def.type === "closed") {
      if (multiSelectFields.has(name)) {
        if (!Array.isArray(rawValue) || rawValue.length === 0) {
          throw new Error(`Selecione ao menos uma opção para ${name}`);
        }
        return rawValue.join(", ");
      }
      if (!rawValue) {
        throw new Error(`Selecione um valor para ${name}`);
      }
      return String(rawValue);
    }

    if (def.type === "location") {
      const distance = Number(rawValue);
      if (Number.isNaN(distance)) {
        throw new Error(`Valor de localização inválido para ${name}`);
      }
      return String(distance);
    }

    if (def.type === "schedule") {
      if (typeof rawValue === "string") {
        return rawValue;
      }

      const entries: Array<{ start: string; end: string }> = Array.isArray(rawValue?.entries)
        ? rawValue.entries
        : [];
      if (!entries.length) {
        throw new Error(`Adicione ao menos um intervalo para ${name}`);
      }

      const scheduleValue = entries
        .map((entry) => `${formatScheduleTime(entry.start)}-${formatScheduleTime(entry.end)}`)
        .join("; ");

      if (!scheduleValue) {
        throw new Error(`Intervalo de horário inválido para ${name}`);
      }

      return scheduleValue;
    }

    return String(rawValue ?? "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCreationForm() || !model) return;
    setSubmitting(true);
    setError(null);
    try {
      const preferencesPayload = Object.entries(model)
        .filter(([name, def]) => isFieldFilled(name, def, formValues[name]))
        .map(([name]) => ({
          name,
          value: serializeValue(name, formValues[name]),
          weight: DEFAULT_WEIGHT,
        }));

      await preference.create({ preferences: preferencesPayload });
      setSuccess("Preferências salvas com sucesso!");
      await loadUserPreferences();
    } catch (err: any) {
      if (handleAuthRedirect(err)) return;
      setError(err?.response?.data?.error || err?.message || "Erro ao salvar preferências");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMulti = (name: string, option: string) => {
    setEditingPreferences((prev) => {
      const current = prev[name];
      const values = Array.isArray(current?.value) ? [...current.value] : [];
      const idx = values.indexOf(option);
      if (idx >= 0) values.splice(idx, 1);
      else values.push(option);
      return {
        ...prev,
        [name]: {
          weight: current?.weight ?? DEFAULT_WEIGHT,
          value: values,
        },
      };
    });
  };

  const handleEditValueChange = (name: string, value: any) => {
    setEditingPreferences((prev) => ({
      ...prev,
      [name]: {
        weight: prev[name]?.weight ?? DEFAULT_WEIGHT,
        value,
      },
    }));
  };

  const handleEditWeightChange = (name: string, weight: number) => {
    setEditingPreferences((prev) => ({
      ...prev,
      [name]: {
        value: prev[name]?.value,
        weight,
      },
    }));
  };

  const handleUpdatePreference = async (name: string) => {
    if (!editingPreferences[name]) return;
    setError(null);
    setSuccess(null);
    setManagingPreference(name);
    try {
      const payload = {
        name,
        value: serializeValue(name, editingPreferences[name].value),
        weight: editingPreferences[name].weight,
      };

      await preference.update(payload);
      setSuccess(`Preferência "${name}" atualizada com sucesso!`);
      await loadUserPreferences();
    } catch (err: any) {
      if (handleAuthRedirect(err)) return;
      setError(err?.response?.data?.error || err?.message || "Erro ao atualizar preferência");
    } finally {
      setManagingPreference(null);
    }
  };

  const handleDeletePreference = async (name: string) => {
    if (!window.confirm(`Deseja realmente excluir "${name}"? \nÉ obrigatório manter pelo menos 3 preferências.`)) {
      return;
    }
    setError(null);
    setSuccess(null);
    setManagingPreference(name);
    try {
      await preference.delete(name);
      setSuccess(`Preferência "${name}" excluída com sucesso!`);
      await loadUserPreferences();
    } catch (err: any) {
      if (handleAuthRedirect(err)) return;
      setError(err?.response?.data?.error || err?.message || "Erro ao excluir preferência");
    } finally {
      setManagingPreference(null);
    }
  };

  if (loadingModel && loadingPreferences) {
    return <div>Carregando preferências...</div>;
  }

  if (!model) {
    return <div>Modelo de preferências não encontrado.</div>;
  }

  return (
    <div className="cadastro-page">
      <div className="cadastro-container">
        <div className="cadastro-header">
          <h2>CASAR</h2>
          <h3>Gestão de Preferências</h3>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <section style={{ marginBottom: 32 }}>
          <h4 style={{ marginBottom: 16 }}>Cadastrar novas preferências</h4>
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
                        onChange={(e) => setFormValues((prev) => ({ ...prev, [name]: e.target.value }))}
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
                    onChange={(e) => setFormValues((prev) => ({ ...prev, [name]: e.target.value === "" ? "" : Number(e.target.value) }))}
                    placeholder="Raio máximo em km (ex: 5)"
                  />
                )}

                {def.type === "schedule" && (
                  <div>
                    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">Início</label>
                        <input
                          type="time"
                          className="form-input"
                          value={formValues[name]?.start ?? ""}
                          onChange={(e) => setScheduleField(name, "start", e.target.value)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">Fim</label>
                        <input
                          type="time"
                          className="form-input"
                          value={formValues[name]?.end ?? ""}
                          onChange={(e) => setScheduleField(name, "end", e.target.value)}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => addScheduleEntry(name)}
                    >
                      Adicionar intervalo
                    </button>
                    <div style={{ marginTop: 12 }}>
                      {(formValues[name]?.entries || []).length === 0 ? (
                        <small style={{ color: "#666" }}>Nenhum intervalo adicionado.</small>
                      ) : (
                        <ul style={{ listStyle: "disc", paddingLeft: 20, color: "#333" }}>
                          {formValues[name].entries.map((entry: { start: string; end: string }, index: number) => (
                            <li key={`${entry.start}-${entry.end}-${index}`} style={{ marginBottom: 4 }}>
                              {formatScheduleTime(entry.start)} - {formatScheduleTime(entry.end)}
                              <button
                                type="button"
                                style={{ marginLeft: 8, color: "#d00" }}
                                onClick={() => removeScheduleEntry(name, index)}
                              >
                                remover
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {def.type !== "closed" && def.type !== "location" && def.type !== "schedule" && (
                  <input
                    type="text"
                    className="form-input"
                    value={formValues[name] ?? ""}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, [name]: e.target.value }))}
                  />
                )}
              </div>
            ))}

            <div className="form-actions" style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Salvando..." : "Salvar Preferências"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => router.push("/")}>
                Voltar
              </button>
            </div>
          </form>
        </section>

        <section>
          <h4 style={{ marginBottom: 16 }}>Preferências cadastradas</h4>
          {loadingPreferences ? (
            <div>Carregando preferências existentes...</div>
          ) : preferences.length === 0 ? (
            <div>Você ainda não possui preferências cadastradas.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {preferences.map((pref) => {
                const definition = model[pref.name];
                const editing = editingPreferences[pref.name];
                return (
                  <div key={pref.name} className="card" style={{ padding: 16 }}>
                    <div className="card-title" style={{ marginBottom: 12 }}>{pref.name}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <label className="form-label">Valor</label>
                        {definition?.type === "closed" && multiSelectFields.has(pref.name) ? (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 8 }}>
                            {definition.expected.map((option) => (
                              <label key={option} style={{ fontWeight: 500 }}>
                                <input
                                  type="checkbox"
                                  value={option}
                                  checked={Array.isArray(editing?.value) && editing.value.includes(option)}
                                  onChange={() => handleEditMulti(pref.name, option)}
                                  style={{ marginRight: 8 }}
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        ) : definition?.type === "closed" ? (
                          <select
                            className="form-select"
                            value={editing?.value ?? ""}
                            onChange={(e) => handleEditValueChange(pref.name, e.target.value)}
                          >
                            <option value="" disabled>
                              Selecionar opção
                            </option>
                            {definition.expected.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : definition?.type === "location" ? (
                          <input
                            type="number"
                            min={0}
                            step={0.1}
                            className="form-input"
                            value={editing?.value ?? ""}
                            onChange={(e) =>
                              handleEditValueChange(
                                pref.name,
                                e.target.value === "" ? "" : Number(e.target.value)
                              )
                            }
                          />
                        ) : definition?.type === "schedule" ? (
                          <textarea
                            className="form-textarea"
                            value={editing?.value ?? ""}
                            onChange={(e) => handleEditValueChange(pref.name, e.target.value)}
                            rows={3}
                            placeholder="Formato esperado: 22h-06h; 23h-07h"
                          />
                        ) : (
                          <input
                            type="text"
                            className="form-input"
                            value={editing?.value ?? ""}
                            onChange={(e) => handleEditValueChange(pref.name, e.target.value)}
                          />
                        )}
                        {definition?.type === "schedule" && (
                          <small style={{ color: "#666" }}>
                            Use o padrão HHh-HHh separado por ponto e vírgula para múltiplos intervalos.
                          </small>
                        )}
                      </div>

                      <div>
                        <label className="form-label">Peso (1 a 10)</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          className="form-input"
                          value={editing?.weight ?? DEFAULT_WEIGHT}
                          onChange={(e) => handleEditWeightChange(pref.name, Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="form-actions" style={{ marginTop: 16, display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleUpdatePreference(pref.name)}
                        disabled={managingPreference === pref.name}
                      >
                        {managingPreference === pref.name ? "Atualizando..." : "Salvar alterações"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleDeletePreference(pref.name)}
                        disabled={managingPreference === pref.name}
                      >
                        {managingPreference === pref.name ? "Processando..." : "Excluir"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
