"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CadastroImovel() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numeroVagas, setNumeroVagas] = useState<number | "">("");

  const [quartos, setQuartos] = useState<number | "">("");
  const [banheiros, setBanheiros] = useState<number | "">("");
  const [garagem, setGaragem] = useState<number | "">("");

  const [hospedagemFestas, setHospedagemFestas] = useState("");
  const [presencaTrotes, setPresencaTrotes] = useState("");

  const [petsPermitidos, setPetsPermitidos] = useState(false);
  const [regrasTexto, setRegrasTexto] = useState("");

  const [fotos, setFotos] = useState<FileList | null>(null);
  const [valorLocacao, setValorLocacao] = useState<number | "">("");
  const [moradoresAtuais, setMoradoresAtuais] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!nome.trim()) {
      setError("Nome do imóvel é obrigatório");
      return false;
    }
    if (!endereco.trim()) {
      setError("Endereço é obrigatório");
      return false;
    }
    if (numeroVagas === "" || Number(numeroVagas) <= 0) {
      setError("Número de vagas deve ser maior que zero");
      return false;
    }
    if (!hospedagemFestas) {
      setError("Informe a frequência de hospedagem de festas");
      return false;
    }
    if (!presencaTrotes) {
      setError("Informe se há presença de trotes");
      return false;
    }
    if (valorLocacao === "" || Number(valorLocacao) < 0) {
      setError("Informe o valor da locação (valor >= 0)");
      return false;
    }
    setError(null);
    return true;
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFotos(e.target.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      // Simular envio para API
      await new Promise((res) => setTimeout(res, 900));
      setSuccess("Imóvel cadastrado com sucesso!");

      // Após salvar, redireciona para a página de conta ou lista de imóveis
      setTimeout(() => router.push("/conta"), 900);
    } catch (err: any) {
      setError(err?.message || "Erro ao cadastrar imóvel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastro-page">
      <div className="cadastro-container">
        <div className="cadastro-header">
          <h2>CASAR</h2>
          <h3>Cadastro de Imóvel</h3>
        </div>

        <form onSubmit={handleSubmit} className="cadastro-form">
          <div className="form-group">
            <label className="form-label">Nome</label>
            <input
              type="text"
              className="form-input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome da república/imóvel"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Endereço completo</label>
            <textarea
              className="form-textarea"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número, bairro, cidade, estado"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Número de vagas (moradores máximos)</label>
              <input
                type="number"
                min={1}
                className="form-input"
                value={numeroVagas}
                onChange={(e) => setNumeroVagas(e.target.value === "" ? "" : Number(e.target.value))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Regras (breve)</label>
              <input
                type="text"
                className="form-input"
                value={regrasTexto}
                onChange={(e) => setRegrasTexto(e.target.value)}
                placeholder="Ex: Sem festas após 23h, não aceitamos trotes..."
              />
            </div>
          </div>

          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-title">Estrutura</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quartos</label>
                <input
                  type="number"
                  min={0}
                  className="form-input"
                  value={quartos}
                  onChange={(e) => setQuartos(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Banheiros</label>
                <input
                  type="number"
                  min={0}
                  className="form-input"
                  value={banheiros}
                  onChange={(e) => setBanheiros(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Garagem (vagas)</label>
                <input
                  type="number"
                  min={0}
                  className="form-input"
                  value={garagem}
                  onChange={(e) => setGaragem(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Hospedagem de festas</label>
              <select className="form-select" value={hospedagemFestas} onChange={(e) => setHospedagemFestas(e.target.value)} required>
                <option value="" disabled>
                  Selecionar
                </option>
                <option value="nenhuma">Nenhuma</option>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Presença de trotes</label>
              <select className="form-select" value={presencaTrotes} onChange={(e) => setPresencaTrotes(e.target.value)} required>
                <option value="" disabled>
                  Selecionar
                </option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Pets permitidos</label>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input type="checkbox" checked={petsPermitidos} onChange={(e) => setPetsPermitidos(e.target.checked)} />
                <span>Permitir pets neste imóvel</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Fotos (área comum)</label>
              <input type="file" className="form-input" accept="image/*" multiple onChange={handleFiles} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Valor da locação (R$ / mês)</label>
              <input
                type="number"
                min={0}
                className="form-input"
                value={valorLocacao}
                onChange={(e) => setValorLocacao(e.target.value === "" ? "" : Number(e.target.value))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Moradores atuais do imóvel</label>
              <textarea
                className="form-textarea"
                value={moradoresAtuais}
                onChange={(e) => setMoradoresAtuais(e.target.value)}
                placeholder="Descreva brevemente os perfis dos moradores atuais"
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Salvando..." : "Cadastrar Imóvel"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => router.push('/')}>Voltar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
