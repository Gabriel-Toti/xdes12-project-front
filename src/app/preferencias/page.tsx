"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Preferencias() {
  const router = useRouter();

  const [alcool, setAlcool] = useState("");
  const [festas, setFestas] = useState("");
  const [pets, setPets] = useState("");
  const [convivencia, setConvivencia] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [tipoMoradia, setTipoMoradia] = useState("");
  const [valorMoradia, setValorMoradia] = useState("");
  const [generoColega, setGeneroColega] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [horariosSilencio, setHorariosSilencio] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (
      !alcool ||
      !festas ||
      !pets ||
      !convivencia ||
      !tipoMoradia ||
      !valorMoradia ||
      !generoColega ||
      !localizacao ||
      !horariosSilencio
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
                  Selecionar uso de álcool
                </option>
                <option value="nunca">Nunca</option>
                <option value="socialmente">Socialmente</option>
                <option value="regularmente">Regularmente</option>
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
                <option value="raramente">Raramente</option>
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
                <option value="nao">Não tem / não aceita</option>
                <option value="tem">Tem pets</option>
                <option value="aceita">Aceita pets</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Estilo de convivência</label>
              <select
                className="form-select"
                value={convivencia}
                onChange={(e) => setConvivencia(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecionar estilo
                </option>
                <option value="organizado">Organizado</option>
                <option value="relaxado">Relaxado</option>
                <option value="colaborativo">
                  Colaborativo / Compartilha tarefas
                </option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Hobbies / Interesses</label>
            <textarea
              className="form-textarea"
              value={hobbies}
              onChange={(e) => setHobbies(e.target.value)}
              placeholder="Descreva seus hobbies e interesses"
            />
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
                <option value="apartamento">Apartamento</option>
                <option value="casa">Casa</option>
                <option value="quitinete">Quitinete / Estúdio</option>
                <option value="republica">República</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Valor de moradia (mensal)</label>
              <select
                className="form-select"
                value={valorMoradia}
                onChange={(e) => setValorMoradia(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecionar faixa de valor
                </option>
                <option value="0-800">Até R$800</option>
                <option value="800-1500">R$800 - R$1.500</option>
                <option value="1500-3000">R$1.500 - R$3.000</option>
                <option value="3000+">Acima de R$3.000</option>
              </select>
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
              <label className="form-label">Localização</label>
              <input
                type="text"
                className="form-input"
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
                placeholder="Ex: Zona Sul, Centro, Bairro X..."
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Horários de Silêncio</label>
            <select
              className="form-select"
              value={horariosSilencio}
              onChange={(e) => setHorariosSilencio(e.target.value)}
              required
            >
              <option value="" disabled>
                Selecionar horário de silêncio
              </option>
              <option value="22-7">22:00 - 07:00</option>
              <option value="23-8">23:00 - 08:00</option>
              <option value="0-0">Sem horário específico</option>
            </select>
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
