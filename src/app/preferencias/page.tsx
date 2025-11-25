"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { preference } from "@/utils/api";

type ModelField = {
  type: "closed" | "location" | "schedule" | string;
  expected: string[];
};

type PreferenceEntry = {
  name: string;
  value: string;
  weight: number;
};

export default function Preferencias() {
  const router = useRouter();
  const [model, setModel] = useState<Record<string, ModelField> | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalFormValues, setOriginalFormValues] = useState<Record<string, any>>({});
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [preferenceWeights, setPreferenceWeights] = useState<Record<string, number>>({});
  const [preferences, setPreferences] = useState<PreferenceEntry[]>([]);
  const [preferencesToDelete, setPreferencesToDelete] = useState<Set<string>>(new Set());
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const multiSelectFields = new Set(["Estilo de Convivência", "Hobbies"]);

  // Parse schedule value from backend format "HHh-HHh; HHh-HHh" to entries array
  const parseScheduleValue = (value: string): Array<{ start: string; end: string }> => {
    if (!value) return [];
    const intervals = value.split(";").map(s => s.trim());
    return intervals.map(interval => {
      const [start, end] = interval.split("-").map(s => s.trim());
      // Convert "22h" or "22h30" to "22:00" or "22:30"
      const parseTime = (timeStr: string): string => {
        const match = timeStr.match(/(\d{1,2})h(\d{2})?/);
        if (!match) return "";
        const hour = match[1].padStart(2, "0");
        const minute = match[2] || "00";
        return `${hour}:${minute}`;
      };
      return { start: parseTime(start), end: parseTime(end) };
    }).filter(e => e.start && e.end);
  };

  // Format schedule entries to backend format
  const formatScheduleTime = (time: string): string => {
    if (!time) return "";
    const [hh = "00", mm = "00"] = time.split(":");
    const normalizedHour = hh.padStart(2, "0");
    return !mm || mm === "00" ? `${normalizedHour}h` : `${normalizedHour}h${mm}`;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoadingModel(true);
      setLoadingPreferences(true);
      try {
        const [modelRes, preferencesData] = await Promise.allSettled([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/preference/model`),
          preference.list().catch(() => [])
        ]);

        if (modelRes.status === 'fulfilled') {
          const res = modelRes.value;
          if (!res.ok) throw new Error("Falha ao carregar modelo de preferências");
          const json = await res.json();
          setModel(json);

          // Initialize defaults
          const defaults: Record<string, any> = {};
          Object.entries(json).forEach(([k, v]: [any, any]) => {
            if (v.type === "closed") {
              if (multiSelectFields.has(k)) defaults[k] = [];
              else defaults[k] = "";
            } else if (v.type === "location") {
              defaults[k] = "";
            } else if (v.type === "schedule") {
              defaults[k] = { entries: [] };
            } else {
              defaults[k] = "";
            }
          });

          // Fill with existing preferences
          if (preferencesData.status === 'fulfilled') {
            const existingPrefs = preferencesData.value || [];
            setPreferences(existingPrefs);

            const weights: Record<string, number> = {};
            existingPrefs.forEach((pref: PreferenceEntry) => {
              const def = json[pref.name];
              if (!def) return;

              // Armazenar peso
              weights[pref.name] = pref.weight || 5;

              if (def.type === "closed") {
                if (multiSelectFields.has(pref.name)) {
                  defaults[pref.name] = pref.value.split(", ").filter(Boolean);
                } else {
                  defaults[pref.name] = pref.value;
                }
              } else if (def.type === "location") {
                defaults[pref.name] = pref.value;
              } else if (def.type === "schedule") {
                defaults[pref.name] = { entries: parseScheduleValue(pref.value) };
              } else {
                defaults[pref.name] = pref.value;
              }
            });
            setPreferenceWeights(weights);
          }

          setFormValues(defaults);
          setOriginalFormValues(JSON.parse(JSON.stringify(defaults)));
        }
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar dados");
      } finally {
        setLoadingModel(false);
        setLoadingPreferences(false);
      }
    };
    loadData();
  }, []);

  const toggleMulti = (field: string, value: string) => {
    if (!isEditing) return;
    setFormValues((prev) => {
      const arr = Array.isArray(prev[field]) ? [...prev[field]] : [];
      const idx = arr.indexOf(value);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(value);
      return { ...prev, [field]: arr };
    });
  };

  const addScheduleEntry = (field: string, start: string, end: string) => {
    if (!isEditing) return;
    setFormValues((prev) => {
      const schedule = prev[field] || { entries: [] };
      const entries = Array.isArray(schedule.entries) ? schedule.entries : [];
      const newEntries = [...entries, { start, end }];
      return { ...prev, [field]: { ...schedule, entries: newEntries } };
    });
  };

  const removeScheduleEntry = (field: string, index: number) => {
    if (!isEditing) return;
    setFormValues((prev) => {
      const schedule = prev[field] || { entries: [] };
      const entries = Array.isArray(schedule.entries) ? [...schedule.entries] : [];
      entries.splice(index, 1);
      return { ...prev, [field]: { ...schedule, entries } };
    });
  };

  const handleDeletePreference = (name: string) => {
    if (!isEditing) return;
    if (preferences.length - preferencesToDelete.size <= 3) {
      setError("Você deve manter pelo menos 3 preferências ativas.");
      return;
    }
    setPreferencesToDelete(prev => new Set(prev).add(name));
    // Clear the field value
    setFormValues(prev => {
      const def = model?.[name];
      if (!def) return prev;
      const cleared = { ...prev };
      if (def.type === "closed") {
        if (multiSelectFields.has(name)) cleared[name] = [];
        else cleared[name] = "";
      } else if (def.type === "location") {
        cleared[name] = "";
      } else if (def.type === "schedule") {
        cleared[name] = { entries: [] };
      } else {
        cleared[name] = "";
      }
      return cleared;
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormValues(JSON.parse(JSON.stringify(originalFormValues)));
    setPreferencesToDelete(new Set());
    setError(null);
  };

  const validate = (): boolean => {
    if (!model) return false;

    const activePreferences = preferences.filter(p => !preferencesToDelete.has(p.name));
    const newPreferences = Object.entries(formValues).filter(([name, value]) => {
      if (preferencesToDelete.has(name)) return false;
      const existingPref = preferences.find(p => p.name === name);
      if (existingPref) {
        // Check if value changed
        const def = model[name];
        if (!def) return false;
        
        if (def.type === "closed") {
          if (multiSelectFields.has(name)) {
            const current = Array.isArray(value) ? value.join(", ") : "";
            return current !== existingPref.value;
          }
          return value !== existingPref.value;
        } else if (def.type === "location") {
          return value !== "" && value !== existingPref.value;
        } else if (def.type === "schedule") {
          const current = Array.isArray(value?.entries) && value.entries.length > 0
            ? value.entries.map((e: { start: string; end: string }) => 
                `${formatScheduleTime(e.start)}-${formatScheduleTime(e.end)}`
              ).join("; ")
            : "";
          return current !== existingPref.value;
        }
        return value !== existingPref.value;
      }
      
      // New preference
      const def = model[name];
      if (!def) return false;
      
      if (def.type === "closed") {
        if (multiSelectFields.has(name)) {
          return Array.isArray(value) && value.length > 0;
        }
        return value !== "" && value !== null && value !== undefined;
      }
      
      if (def.type === "location") {
        return value !== "" && value !== null && value !== undefined && !isNaN(Number(value));
      }
      
      if (def.type === "schedule") {
        return Array.isArray(value?.entries) && value.entries.length > 0;
      }
      
      return value !== "" && value !== null && value !== undefined;
    });

    const totalActive = activePreferences.length + newPreferences.length;
    if (totalActive < 3) {
      setError(`Você deve ter ao menos 3 preferências ativas. Atualmente você terá ${totalActive} preferência(s) ativa(s).`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!model) return;
    
    setSubmitting(true);
    setError(null);

    try {
      // Delete preferences marked for deletion
      for (const name of preferencesToDelete) {
        try {
          await preference.delete(name);
        } catch (err: any) {
          console.error(`Erro ao deletar preferência ${name}:`, err);
        }
      }

      // Collect updates and new preferences
      const updates: Array<{ name: string; value?: string; weight?: number }> = [];
      const newPreferences: Array<{ name: string; value: string; weight: number }> = [];

      for (const [name, def] of Object.entries(model)) {
        if (preferencesToDelete.has(name)) continue;

        const val = formValues[name];
        const existingPref = preferences.find(p => p.name === name);

        let isFilled = false;
        let formattedValue = "";

        if (def.type === "closed") {
          if (multiSelectFields.has(name)) {
            if (Array.isArray(val) && val.length > 0) {
              isFilled = true;
              formattedValue = val.join(", ");
            }
          } else {
            if (val !== "" && val !== null && val !== undefined) {
              isFilled = true;
              formattedValue = String(val);
            }
          }
        } else if (def.type === "location") {
          if (val !== "" && val !== null && val !== undefined && !isNaN(Number(val))) {
            isFilled = true;
            formattedValue = String(val);
          }
        } else if (def.type === "schedule") {
          if (Array.isArray(val?.entries) && val.entries.length > 0) {
            isFilled = true;
            formattedValue = val.entries
              .map((entry: { start: string; end: string }) => 
                `${formatScheduleTime(entry.start)}-${formatScheduleTime(entry.end)}`
              )
              .join("; ");
          }
        } else {
          if (val !== "" && val !== null && val !== undefined) {
            isFilled = true;
            formattedValue = String(val);
          }
        }

        if (isFilled) {
          const weight = preferenceWeights[name] || 5; // Default weight 5
          if (existingPref) {
            // Check if value or weight changed
            const valueChanged = existingPref.value !== formattedValue;
            const weightChanged = existingPref.weight !== weight;
            if (valueChanged || weightChanged) {
              updates.push({ name, value: formattedValue, weight });
            }
          } else {
            // New preference
            newPreferences.push({ name, value: formattedValue, weight });
          }
        }
      }

      // Execute updates
      for (const update of updates) {
        try {
          await preference.update(update);
        } catch (err: any) {
          console.error(`Erro ao atualizar preferência ${update.name}:`, err);
        }
      }

      // Create new preferences
      if (newPreferences.length > 0) {
        await preference.create({ preferences: newPreferences });
      }

      // Reload data
      const updatedPreferences = await preference.list();
      setPreferences(updatedPreferences);
      
      // Rebuild form values with updated preferences
      const updatedDefaults: Record<string, any> = {};
      Object.entries(model).forEach(([k, v]: [any, any]) => {
        if (v.type === "closed") {
          if (multiSelectFields.has(k)) updatedDefaults[k] = [];
          else updatedDefaults[k] = "";
        } else if (v.type === "location") {
          updatedDefaults[k] = "";
        } else if (v.type === "schedule") {
          updatedDefaults[k] = { entries: [] };
        } else {
          updatedDefaults[k] = "";
        }
      });

      updatedPreferences.forEach((pref: PreferenceEntry) => {
        const def = model[pref.name];
        if (!def) return;

        if (def.type === "closed") {
          if (multiSelectFields.has(pref.name)) {
            updatedDefaults[pref.name] = pref.value.split(", ").filter(Boolean);
          } else {
            updatedDefaults[pref.name] = pref.value;
          }
        } else if (def.type === "location") {
          updatedDefaults[pref.name] = pref.value;
        } else if (def.type === "schedule") {
          updatedDefaults[pref.name] = { entries: parseScheduleValue(pref.value) };
        } else {
          updatedDefaults[pref.name] = pref.value;
        }
      });

      setFormValues(updatedDefaults);
      setOriginalFormValues(JSON.parse(JSON.stringify(updatedDefaults)));
      setPreferencesToDelete(new Set());
      setIsEditing(false);
      setSuccess("Preferências salvas com sucesso!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Erro ao salvar preferências");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingModel || loadingPreferences) {
    return (
      <div className="cadastro-page">
        <div className="cadastro-container">
          <div>Carregando modelo de preferências...</div>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="cadastro-page">
        <div className="cadastro-container">
          <div>Modelo de preferências não encontrado.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cadastro-page">
      <div className="cadastro-container">
        <div className="cadastro-header">
          <h2>CASAR</h2>
          <h3>Preferências</h3>
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {!isEditing ? (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsEditing(true)}
                  style={{ color: "white" }}
                >
                  Editar Preferências
                </button>
                <span style={{ color: "#666", fontSize: "0.875rem" }}>
                  {preferences.length} preferência(s) cadastrada(s)
                </span>
              </>
            ) : (
              <>
                <span style={{ color: "#666", fontSize: "0.875rem" }}>
                  Modo de edição ativo
                </span>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="cadastro-form">
          {Object.entries(model).map(([name, def]) => {
            const existingPref = preferences.find(p => p.name === name);
            const isExisting = !!existingPref;
            const isDeleted = preferencesToDelete.has(name);
            // Quando não está editando: desabilitar tudo
            // Quando está editando: habilitar existentes (para editar) e não existentes (para adicionar)
            const isDisabled = !isEditing;
            const opacity = !isEditing && isExisting ? 0.6 : 1;

            return (
              <div
                key={name}
                className="form-group"
                style={{
                  marginBottom: 16,
                  opacity,
                  position: "relative"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <label className="form-label">{name}</label>
                    {isExisting && !isDeleted && (
                      <span style={{ 
                        fontSize: "0.75rem", 
                        color: "#059669", 
                        background: "#d1fae5",
                        padding: "2px 6px",
                        borderRadius: "4px"
                      }}>
                        ✓ Cadastrada
                      </span>
                    )}
                    {!isExisting && isEditing && (
                      <span style={{ 
                        fontSize: "0.75rem", 
                        color: "#666",
                        fontStyle: "italic"
                      }}>
                        Nova preferência
                      </span>
                    )}
                  </div>
                  {isEditing && isExisting && !isDeleted && (
                    <button
                      type="button"
                      onClick={() => handleDeletePreference(name)}
                      disabled={preferences.length - preferencesToDelete.size <= 3}
                      style={{
                        padding: "4px 8px",
                        background: preferences.length - preferencesToDelete.size <= 3 ? "#9ca3af" : "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: preferences.length - preferencesToDelete.size <= 3 ? "not-allowed" : "pointer",
                        fontSize: "0.75rem"
                      }}
                      title={preferences.length - preferencesToDelete.size <= 3 ? "Você deve manter pelo menos 3 preferências" : "Excluir esta preferência"}
                    >
                      Excluir
                    </button>
                  )}
                  {isDeleted && (
                    <span style={{ color: "#ef4444", fontSize: "0.75rem", fontStyle: "italic", fontWeight: "bold" }}>
                      Será excluída
                    </span>
                  )}
                </div>

                {def.type === "closed" && (
                  <>
                    {multiSelectFields.has(name) ? (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 8 }}>
                        {def.expected.map((opt) => (
                          <label
                            key={opt}
                            style={{
                              fontWeight: 500,
                              opacity: isDisabled ? 0.5 : 1,
                              cursor: isDisabled ? "not-allowed" : "pointer"
                            }}
                          >
                            <input
                              type="checkbox"
                              value={opt}
                              checked={Array.isArray(formValues[name]) && formValues[name].includes(opt)}
                              onChange={() => toggleMulti(name, opt)}
                              disabled={isDisabled}
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
                        onChange={(e) => {
                          if (!isEditing) return;
                          setFormValues((p) => ({ ...p, [name]: e.target.value }));
                        }}
                        disabled={isDisabled}
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
                      onChange={(e) => {
                        if (!isEditing) return;
                        setFormValues((p) => ({ ...p, [name]: e.target.value === "" ? "" : Number(e.target.value) }));
                      }}
                      placeholder="Raio máximo em km (ex: 5)"
                      disabled={isDisabled}
                    />
                )}

                {def.type === "schedule" && (
                  <div>
                    <div style={{ marginBottom: 12 }}>
                      {Array.isArray(formValues[name]?.entries) && formValues[name].entries.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                          {formValues[name].entries.map((entry: { start: string; end: string }, idx: number) => (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                                padding: "8px",
                                background: "#f9fafb",
                                borderRadius: "4px"
                              }}
                            >
                              <span style={{ flex: 1 }}>
                                {formatScheduleTime(entry.start)} - {formatScheduleTime(entry.end)}
                              </span>
                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={() => removeScheduleEntry(name, idx)}
                                  style={{
                                    padding: "4px 8px",
                                    background: "#ef4444",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer"
                                  }}
                                >
                                  Remover
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {isEditing && (
                        <div style={{ display: "flex", gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <label className="form-label">Horário de Início</label>
                            <input
                              type="time"
                              className="form-input"
                              id={`${name}-start`}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label className="form-label">Horário de Fim</label>
                            <input
                              type="time"
                              className="form-input"
                              id={`${name}-end`}
                            />
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-end" }}>
                            <button
                              type="button"
                              onClick={() => {
                                const startInput = document.getElementById(`${name}-start`) as HTMLInputElement;
                                const endInput = document.getElementById(`${name}-end`) as HTMLInputElement;
                                if (startInput?.value && endInput?.value) {
                                  addScheduleEntry(name, startInput.value, endInput.value);
                                  startInput.value = "";
                                  endInput.value = "";
                                }
                              }}
                              style={{
                                padding: "8px 16px",
                                background: "#059669",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer"
                              }}
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {def.type !== "closed" && def.type !== "location" && def.type !== "schedule" && (
                  <input
                    type="text"
                    className="form-input"
                    value={formValues[name] ?? ""}
                    onChange={(e) => {
                      if (!isEditing) return;
                      setFormValues((p) => ({ ...p, [name]: e.target.value }));
                    }}
                    disabled={isDisabled}
                  />
                )}

                {/* Campo de peso - aparece apenas quando a preferência está preenchida */}
                {isEditing && (() => {
                  const hasValue = (() => {
                    if (def.type === "closed") {
                      if (multiSelectFields.has(name)) {
                        return Array.isArray(formValues[name]) && formValues[name].length > 0;
                      }
                      return formValues[name] !== "" && formValues[name] !== null && formValues[name] !== undefined;
                    } else if (def.type === "location") {
                      return formValues[name] !== "" && !isNaN(Number(formValues[name]));
                    } else if (def.type === "schedule") {
                      return Array.isArray(formValues[name]?.entries) && formValues[name].entries.length > 0;
                    }
                    return formValues[name] !== "" && formValues[name] !== null && formValues[name] !== undefined;
                  })();

                  if (!hasValue) return null;

                  return (
                    <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <label style={{ fontSize: "0.875rem", color: "#666", minWidth: "120px" }}>
                        Peso (1-10):
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        className="form-input"
                        style={{ width: "80px" }}
                        value={preferenceWeights[name] || 5}
                        onChange={(e) => {
                          const weight = Math.max(1, Math.min(10, parseInt(e.target.value) || 5));
                          setPreferenceWeights((p) => ({ ...p, [name]: weight }));
                        }}
                        disabled={isDisabled}
                      />
                      <span style={{ fontSize: "0.75rem", color: "#666" }}>
                        {(() => {
                          const weight = preferenceWeights[name] || 5;
                          if (weight === 10) return "Máxima importância";
                          if (weight >= 7) return "Alta importância";
                          if (weight >= 4) return "Média importância";
                          return "Baixa importância";
                        })()}
                      </span>
                    </div>
                  );
                })()}
              </div>
            );
          })}

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions" style={{ display: "flex", gap: 8 }}>
            {isEditing ? (
              <>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ color: "white" }}>
                  {submitting ? "Salvando..." : "Salvar Alterações"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={submitting}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.push("/conta")}
              >
                Voltar para Conta
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
