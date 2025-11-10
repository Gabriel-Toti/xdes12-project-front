"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Preferencias() {
  const router = useRouter();

  const [alcool, setAlcool] = useState("");
  const [festas, setFestas] = useState("");
  const [pets, setPets] = useState("");
  const [convivencia, setConvivencia] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [tipoMoradia, setTipoMoradia] = useState("");
  const [valorMoradia, setValorMoradia] = useState<number | "">("");
  const [generoColega, setGeneroColega] = useState("");
  const [localizacao, setLocalizacao] = useState<number | "">("");
  const [horariosSilencioDays, setHorariosSilencioDays] = useState<string[]>(
    []
  );
  const [horarioInicio, setHorarioInicio] = useState("");
  const [horarioFim, setHorarioFim] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (
      !alcool ||
      !festas ||
      !pets ||
      convivencia.length === 0 ||
      hobbies.length === 0 ||
      !tipoMoradia ||
      valorMoradia === "" ||
      !generoColega ||
      localizacao === "" ||
      horariosSilencioDays.length === 0 ||
      !horarioInicio ||
      !horarioFim
    ) {
      setError("Por favor, preencha todos os campos obrigatórios");
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      // Simulação de envio para API
      await new Promise((res) => setTimeout(res, 800));
      setSuccess("Preferências salvas com sucesso!");

      // Aqui você pode gravar no servidor. Por padrão redireciono para /conta.
      setTimeout(() => router.push("/conta"), 900);
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar preferências");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastro-page">
      <div className="cadastro-container">
        <div className="cadastro-header">
          <h2>CASAR</h2>
          <h3>Cadastro de Preferências</h3>
        </div>

        <form onSubmit={handleSubmit} className="cadastro-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Uso de álcool</label>
              <select
                className="form-select"
                value={alcool}
                onChange={(e) => setAlcool(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecionar opção
                </option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Frequência de festas</label>
              <select
                className="form-select"
                value={festas}
                onChange={(e) => setFestas(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecionar frequência
                </option>
                <option value="nunca">Nunca</option>
                <option value="as_vezes">Às vezes</option>
                <option value="frequentemente">Frequentemente</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Pets</label>
              <select
                className="form-select"
                value={pets}
                onChange={(e) => setPets(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecionar opção
                </option>
                <option value="aceita">Aceita</option>
                <option value="nao_aceita">Não aceita</option>
                <option value="possui">Possui</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Estilo de convivência</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { k: "tranquilo", label: "Tranquilo" },
                  { k: "festeiro", label: "Festeiro" },
                  { k: "organizado", label: "Organizado" },
                  { k: "estudioso", label: "Estudioso" },
                ].map((opt) => (
                  <label key={opt.k} style={{ fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      value={opt.k}
                      checked={convivencia.includes(opt.k)}
                      onChange={(e) => {
                        const v = e.target.value;
                        setConvivencia((prev) =>
                          prev.includes(v)
                            ? prev.filter((x) => x !== v)
                            : [...prev, v]
                        );
                      }}
                      style={{ marginRight: 8 }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Hobbies / Interesses (marque os aplicáveis)
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))",
                gap: 8,
              }}
            >
              {[
                { k: "esportes", label: "Esportes" },
                { k: "jogos", label: "Jogos" },
                { k: "animes", label: "Animes" },
                { k: "leitura", label: "Leitura" },
                { k: "cinema", label: "Cinema" },
                { k: "musica", label: "Música" },
              ].map((opt) => (
                <label key={opt.k} style={{ fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    value={opt.k}
                    checked={hobbies.includes(opt.k)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setHobbies((prev) =>
                        prev.includes(v)
                          ? prev.filter((x) => x !== v)
                          : [...prev, v]
                      );
                    }}
                    style={{ marginRight: 8 }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tipo de moradia</label>
              <select
                className="form-select"
                value={tipoMoradia}
                onChange={(e) => setTipoMoradia(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecionar tipo de moradia
                </option>
                <option value="pensao">Pensão</option>
                <option value="apartamento">Apartamento</option>
                <option value="casa">Casa</option>
                <option value="republica">República</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Valor máximo de moradia (R$ / mês)
              </label>
              <input
                type="number"
                min={0}
                className="form-input"
                value={valorMoradia}
                onChange={(e) =>
                  setValorMoradia(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="Valor máximo que você paga (ex: 1500)"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Gênero do colega de quarto</label>
              <select
                className="form-select"
                value={generoColega}
                onChange={(e) => setGeneroColega(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione o gênero do colega
                </option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="outro">Outro</option>
                <option value="sem_preferencia">Sem preferência</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Localização (raio em km)</label>
              <input
                type="number"
                min={0}
                step={0.1}
                className="form-input"
                value={localizacao}
                onChange={(e) =>
                  setLocalizacao(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="Raio máximo em km (ex: 5)"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Horários de Silêncio</label>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  ["segunda", "Seg"],
                  ["terca", "Ter"],
                  ["quarta", "Qua"],
                  ["quinta", "Qui"],
                  ["sexta", "Sex"],
                  ["sabado", "Sáb"],
                  ["domingo", "Dom"],
                ].map((d) => (
                  <label key={d[0]} style={{ fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      value={d[0]}
                      checked={horariosSilencioDays.includes(d[0])}
                      onChange={(e) => {
                        const v = e.target.value;
                        setHorariosSilencioDays((prev) =>
                          prev.includes(v)
                            ? prev.filter((x) => x !== v)
                            : [...prev, v]
                        );
                      }}
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
                  value={horarioInicio}
                  onChange={(e) => setHorarioInicio(e.target.value)}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Fim</label>
                <input
                  type="time"
                  className="form-input"
                  value={horarioFim}
                  onChange={(e) => setHorarioFim(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar Preferências"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push("/")}
            >
              Voltar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
