"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { preference, user } from "../utils/api";
import Navbar from "../components/Navbar";
import { getErrorMessage } from "../utils/error-handler";

type ModelField = {
  type: "closed" | "location" | "schedule" | string;
  expected: string[];
};

export default function Home() {
  const router = useRouter();
  const [model, setModel] = useState<Record<string, ModelField> | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
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
        // Verificar se o usuário está logado
        let userData = null;
        try {
          userData = await user.me();
          setCurrentUser(userData);
          // Se o usuário estiver logado, redirecionar para /anuncios
          router.push('/anuncios');
          return;
        } catch (err) {
          setCurrentUser(null);
        }

        const [modelRes] = await Promise.allSettled([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/preference/model`)
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

          // Se não está logado, tentar carregar do localStorage
          try {
            const savedPrefs = localStorage.getItem('casar_temp_preferences');
            if (savedPrefs) {
              const parsed = JSON.parse(savedPrefs);
              Object.entries(parsed).forEach(([name, value]: [string, any]) => {
                const def = json[name];
                if (!def) return;
                
                if (def.type === "closed") {
                  if (multiSelectFields.has(name)) {
                    defaults[name] = Array.isArray(value) ? value : [];
                  } else {
                    defaults[name] = value || "";
                  }
                } else if (def.type === "location") {
                  defaults[name] = value || "";
                } else if (def.type === "schedule") {
                  defaults[name] = { entries: parseScheduleValue(value || "") };
                } else {
                  defaults[name] = value || "";
                }
              });
            }
          } catch (err) {
            // Ignorar erros do localStorage
          }

          setFormValues(defaults);
        }
      } catch (err: any) {
        setError(getErrorMessage(err, "Erro ao carregar dados"));
      } finally {
        setLoadingModel(false);
        setLoadingPreferences(false);
      }
    };
    loadData();
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

  const addScheduleEntry = (field: string, start: string, end: string) => {
    setFormValues((prev) => {
      const schedule = prev[field] || { entries: [] };
      const entries = Array.isArray(schedule.entries) ? schedule.entries : [];
      const newEntries = [...entries, { start, end }];
      return { ...prev, [field]: { ...schedule, entries: newEntries } };
    });
  };

  const removeScheduleEntry = (field: string, index: number) => {
    setFormValues((prev) => {
      const schedule = prev[field] || { entries: [] };
      const entries = Array.isArray(schedule.entries) ? [...schedule.entries] : [];
      entries.splice(index, 1);
      return { ...prev, [field]: { ...schedule, entries } };
    });
  };

  const validate = (): boolean => {
    if (!model) return false;

    const newPreferences = Object.entries(formValues).filter(([name, value]) => {
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

    if (newPreferences.length < 3) {
      setError(`Você deve preencher ao menos 3 preferências. Atualmente você preencheu ${newPreferences.length} preferência(s).`);
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
      // Se não está logado, salvar em localStorage
      const tempPrefs: Record<string, any> = {};
      for (const [name, val] of Object.entries(formValues)) {
        const def = model[name];
        if (!def) continue;
        
        if (def.type === "closed") {
          if (multiSelectFields.has(name)) {
            if (Array.isArray(val) && val.length > 0) {
              tempPrefs[name] = val;
            }
          } else {
            if (val !== "" && val !== null && val !== undefined) {
              tempPrefs[name] = val;
            }
          }
        } else if (def.type === "location") {
          if (val !== "" && val !== null && val !== undefined && !isNaN(Number(val))) {
            tempPrefs[name] = val;
          }
        } else if (def.type === "schedule") {
          if (Array.isArray(val?.entries) && val.entries.length > 0) {
            tempPrefs[name] = val.entries
              .map((entry: { start: string; end: string }) => 
                `${formatScheduleTime(entry.start)}-${formatScheduleTime(entry.end)}`
              )
              .join("; ");
          }
        } else {
          if (val !== "" && val !== null && val !== undefined) {
            tempPrefs[name] = val;
          }
        }
      }
      localStorage.setItem('casar_temp_preferences', JSON.stringify(tempPrefs));

      // Redirecionar para /anuncios após salvar
      router.push('/anuncios');
    } catch (err: any) {
      setError(getErrorMessage(err, "Erro ao salvar preferências"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingModel || loadingPreferences) {
    return (
      <div className="app">
        <Navbar />
        <main className="app-main">
          <div className="cadastro-page">
            <div className="cadastro-container">
              <div>Carregando modelo de preferências...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="app">
        <Navbar />
        <main className="app-main">
          <div className="cadastro-page">
            <div className="cadastro-container">
              <div>Modelo de preferências não encontrado.</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <div className="cadastro-page">
          <div className="cadastro-container">
            <div className="cadastro-header">
              <h2>CASAR</h2>
              <h3>Bem-vindo! Configure suas preferências</h3>
              <p style={{ color: "#666", marginTop: "0.5rem" }}>
                Preencha pelo menos 3 preferências para começar a buscar imóveis
              </p>
            </div>

            <form onSubmit={handleSubmit} className="cadastro-form">
              {Object.entries(model).map(([name, def]) => {
                return (
                  <div
                    key={name}
                    className="form-group"
                    style={{
                      marginBottom: 16,
                      position: "relative"
                    }}
                  >
                    <label className="form-label">{name}</label>

                    {def.type === "closed" && (
                      <>
                        {multiSelectFields.has(name) ? (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 8 }}>
                            {def.expected.map((opt) => (
                              <label
                                key={opt}
                                style={{
                                  fontWeight: 500,
                                  cursor: "pointer"
                                }}
                              >
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
                            onChange={(e) => {
                              setFormValues((p) => ({ ...p, [name]: e.target.value }));
                            }}
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
                          setFormValues((p) => ({ ...p, [name]: e.target.value === "" ? "" : Number(e.target.value) }));
                        }}
                        placeholder="Raio máximo em km (ex: 5)"
                      />
                    )}

                    {def.type === "schedule" && (
                      <div>
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
                              </div>
                            ))}
                          </div>
                        )}
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
                      </div>
                    )}

                    {def.type !== "closed" && def.type !== "location" && def.type !== "schedule" && (
                      <input
                        type="text"
                        className="form-input"
                        value={formValues[name] ?? ""}
                        onChange={(e) => {
                          setFormValues((p) => ({ ...p, [name]: e.target.value }));
                        }}
                      />
                    )}
                  </div>
                );
              })}

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="form-actions" style={{ display: "flex", gap: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ color: "white" }}>
                  {submitting ? "Salvando..." : "Continuar para Anúncios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
